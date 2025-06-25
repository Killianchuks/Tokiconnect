import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db"; // Assuming db provides rawQuery and potentially a pool to get clients
import { auth, User } from "@/lib/auth"; // Assuming auth and User are correctly imported
import { PoolClient, QueryResult } from 'pg'; // Import PoolClient and QueryResult from 'pg' if db.rawQuery uses pg directly

// Define an interface for a Payout record as it's stored in the DB (for INSERT/UPDATE)
interface PayoutRecordDb {
  id: string;
  teacher_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: Date;
}

// Define the Payout interface as expected by the frontend (for GET response)
interface PayoutFrontend {
  id: string;
  date: string; // Formatted date string
  teacher: string; // Combined first_name last_name
  amount: number;
  method: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Admin API (POST /api/admin/payouts): Starting payout processing request.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (POST /api/admin/payouts): Unauthorized access attempt for payout processing.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // Fetch teachers with a positive balance (eligible for payout)
    const eligibleTeachersResult = await db.rawQuery(
      `SELECT id, first_name, last_name, balance FROM users WHERE role = 'teacher' AND balance > 0`
    );

    // Explicitly cast rows to the expected array type
    const eligibleTeachers: { id: string; first_name: string; last_name: string; balance: number }[] = eligibleTeachersResult.rows;

    if (eligibleTeachers.length === 0) {
      console.log("Admin API (POST /api/admin/payouts): No eligible teachers found for payout.");
      return NextResponse.json({ message: "No eligible teachers found for payout.", processedCount: 0 });
    }

    const processedPayouts: PayoutRecordDb[] = []; // Use PayoutRecordDb for collected results
    const payoutMethod = "Bank Transfer"; // This could be configurable or determined by teacher settings
    const payoutStatus = "Processed"; // Or 'Pending' if there's an approval step

    let client: PoolClient | null = null; // Declare client outside try block for finally

    try {
      // Get a client from the database pool for transaction
      // This line MUST successfully acquire a client or throw an error.
      // ASSUMPTION: db object exposes a method to get a client (e.g., db.pool.connect() or db.getClient())
      client = await (db as any).pool.connect(); // You might need to cast db to 'any' if 'pool' is not typed
                                                // OR if db is an instance of a client directly, remove .pool.connect()

      // CRITICAL: Ensure client is not null before proceeding with transaction
      if (!client) {
          throw new Error("Failed to acquire database client for transaction.");
      }

      await client.query('BEGIN'); // Start the transaction

      for (const teacher of eligibleTeachers) {
        const payoutAmount = teacher.balance; // Payout the entire balance for simplicity

        // 1. Create a new payout record
        const newPayoutResult: QueryResult<PayoutRecordDb> = await client.query(
          `INSERT INTO payouts (teacher_id, amount, method, status)
           VALUES ($1, $2, $3, $4)
           RETURNING id, teacher_id, amount, method, status, created_at`,
          [teacher.id, payoutAmount, payoutMethod, payoutStatus]
        );
        const newPayout: PayoutRecordDb = newPayoutResult.rows[0];

        // 2. Update the teacher's balance to 0
        await client.query(
          `UPDATE users SET balance = 0 WHERE id = $1`,
          [teacher.id]
        );

        processedPayouts.push(newPayout);
        console.log(`Processed payout for Teacher: ${teacher.first_name} ${teacher.last_name}, Amount: $${payoutAmount}`);
      }

      await client.query('COMMIT'); // Commit the transaction

    } catch (transactionError) {
      if (client) { // This check is still necessary if client acquisition itself might not have thrown an error but subsequent operations failed
        await client.query('ROLLBACK'); // Rollback on error
      }
      console.error("Transaction failed, rolling back:", transactionError);
      throw transactionError; // Re-throw to be caught by the outer catch block
    } finally {
      if (client) {
        client.release(); // Release the client back to the pool
      }
    }

    console.log(`Admin API (POST /api/admin/payouts): Successfully processed ${processedPayouts.length} payouts.`);
    return NextResponse.json({
      message: `${processedPayouts.length} payouts processed successfully.`,
      processedCount: processedPayouts.length,
      payouts: processedPayouts,
    });

  } catch (error) {
    console.error("[ADMIN_PAYOUTS_ROUTE] Error processing payouts:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET handler for fetching payouts (optional, but good to have)
// This fetches already processed payouts, not triggers new ones.
export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/payouts): Starting request to fetch payouts.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/payouts): Unauthorized access attempt to fetch payouts.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const statusFilter = searchParams.get('status');

    let query = `SELECT p.id, p.amount, p.method, p.status, p.created_at AS date,
                        u.first_name, u.last_name
                 FROM payouts p
                 JOIN users u ON p.teacher_id = u.id
                 WHERE 1=1`;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (teacherId) {
      query += ` AND p.teacher_id = $${paramIndex++}`;
      params.push(teacherId);
    }
    if (statusFilter) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(statusFilter);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.rawQuery(query, params);

    // Map rows to match the PayoutFrontend interface expected by the frontend
    const payouts: PayoutFrontend[] = result.rows.map((row: any) => ({ // Cast row to any for flexible access
      id: row.id,
      date: new Date(row.date).toLocaleDateString(), // Format date for frontend
      teacher: `${row.first_name} ${row.last_name}`,
      amount: parseFloat(row.amount), // Ensure amount is a number
      method: row.method,
      status: row.status,
    }));

    console.log("Admin API (GET /api/admin/payouts): Successfully fetched payouts.");
    return NextResponse.json(payouts);

  } catch (error) {
    console.error("[ADMIN_PAYOUTS_ROUTE] Error fetching payouts:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

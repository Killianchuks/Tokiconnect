import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth";

// Define an interface for a Transaction record as expected by the frontend
interface TransactionFrontend {
  id: string;
  date: string; // Formatted date string
  teacher: string; // Teacher's full name
  student: string; // Student's full name
  type: string; // 'lesson' or 'subscription'
  amount: number;
  platformFee: number;
  teacherEarnings: number;
  status: string; // e.g., 'completed', 'pending', 'refunded'
}

export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/transactions): Starting request to fetch transactions.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/transactions): Unauthorized access attempt to fetch transactions.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const statsOnly = searchParams.get('stats'); // Check for the stats query param

    // If 'stats=true' is requested, redirect to or provide finance stats
    if (statsOnly === 'true') {
        // This is typically handled by a separate endpoint like /admin/stats/finances.
        // Your frontend's financeService.getTransactions({ stats: true }) is hitting this,
        // but it should ideally hit /admin/stats/finances.
        // For now, if it hits here, we can return an empty array or an error,
        // or re-fetch from the correct endpoint if you want to keep the current frontend call.
        // The more correct fix is to ensure the frontend calls /admin/stats/finances directly
        // for financial stats, and this endpoint for transaction *list*.
        console.warn("Attempted to fetch stats via /api/admin/transactions. Please adjust frontend to call /api/admin/stats/finances directly for financial stats.");
        // Returning an empty array to prevent client-side parsing errors for now
        // if your frontend expects an array when it asks for stats.
        return NextResponse.json([]);
    }


    let query = `SELECT t.id, t.amount, t.type, t.status, t.created_at AS date,
                        t.platform_fee, t.teacher_earnings,
                        stu.first_name AS student_first_name, stu.last_name AS student_last_name,
                        teach.first_name AS teacher_first_name, teach.last_name AS teacher_last_name
                 FROM transactions t
                 LEFT JOIN users stu ON t.student_id = stu.id
                 LEFT JOIN users teach ON t.teacher_id = teach.id
                 WHERE 1=1`;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (typeFilter) {
      query += ` AND t.type = $${paramIndex++}`;
      params.push(typeFilter);
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.rawQuery(query, params);

    // Map rows to match the TransactionFrontend interface expected by the frontend
    const transactions: TransactionFrontend[] = result.rows.map((row: any) => ({
      id: row.id,
      date: new Date(row.date).toLocaleDateString(), // Format date for frontend
      teacher: row.teacher_first_name && row.teacher_last_name ? `${row.teacher_first_name} ${row.teacher_last_name}` : "N/A",
      student: row.student_first_name && row.student_last_name ? `${row.student_first_name} ${row.student_last_name}` : "N/A",
      type: row.type,
      amount: parseFloat(row.amount),
      platformFee: parseFloat(row.platform_fee),
      teacherEarnings: parseFloat(row.teacher_earnings),
      status: row.status,
    }));

    console.log("Admin API (GET /api/admin/transactions): Successfully fetched transactions.");
    return NextResponse.json(transactions);

  } catch (error) {
    console.error("[ADMIN_TRANSACTIONS_ROUTE] Error fetching transactions:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

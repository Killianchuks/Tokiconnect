export default function TestRoutePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Test Route Working</h1>
      <p>If you can see this page, Next.js routing is working correctly.</p>
      <div className="mt-4">
        <a href="/" className="text-blue-500 hover:underline">
          Go to Home
        </a>
        {" | "}
        <a href="/admin/login" className="text-blue-500 hover:underline">
          Go to Admin Login
        </a>
      </div>
    </div>
  )
}

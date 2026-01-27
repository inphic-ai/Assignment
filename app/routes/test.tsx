import { useOutletContext } from "@remix-run/react";

export default function Test() {
  try {
    const context = useOutletContext<{ currentUser: any; users: any[] }>();
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold">Test Route Works!</h1>
        <p className="mt-4">If you can see this, the routing system is working correctly.</p>
        <p className="mt-2">Current user: {context?.currentUser?.name || "No user"}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold text-red-600">Error!</h1>
        <p className="mt-4">Error: {String(error)}</p>
      </div>
    );
  }
}

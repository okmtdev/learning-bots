import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <Link
            href="#"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            利用規約
          </Link>
          <Link
            href="#"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            プライバシーポリシー
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">© 2026 Colon</p>
      </div>
    </footer>
  );
};

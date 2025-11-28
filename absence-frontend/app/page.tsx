import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Sistem Absensi Digital
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Kelola absensi karyawan dengan mudah dan efisien
        </p>
        
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Real-time</h3>
              <p className="text-sm text-gray-600">Absen langsung tercatat</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Validasi</h3>
              <p className="text-sm text-gray-600">Cegah absen ganda</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Otomatis</h3>
              <p className="text-sm text-gray-600">Komentar tergenerate</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-12 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg text-lg"
          >
            Login dengan PeopleHR
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Powered by Next.js & NestJS
        </p>
      </div>
    </div>
  );
}

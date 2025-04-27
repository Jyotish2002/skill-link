'use client';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white animate-fade-in">
      {/* Header Section */}
      <header className="w-full p-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md animate-slide-in-down">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 hover:scale-105 transition-transform duration-300">Welcome to TechEd Academy</h1>
        <p className="text-lg sm:text-xl">Empowering your future with technology and innovation</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 sm:p-20 space-y-16">
        {/* Get Started Section */}
        <section className="text-center animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Start Your Tech Journey Today</h2>
          <p className="text-lg max-w-2xl mx-auto mb-6">
            Join thousands of students building skills in web development, AI, data science, and more.
          </p>
          <a
            href="/register" 
            className="inline-block px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 transform transition-all duration-300 rounded-xl text-lg font-semibold shadow-lg"
          >
            Get Started
          </a>
        </section>

        {/* Subjects Section */}
        <section className="animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4 text-center">Subjects We Teach</h3>
          <ul className="grid sm:grid-cols-3 gap-6 text-center">
            {['Web Development', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Cloud Computing', 'App Development'].map((subject, i) => (
              <li
                key={i}
                className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300 hover:scale-105"
              >
                {subject}
              </li>
            ))}
          </ul>
        </section>

        {/* Qualified Teachers Section */}
        <section className="text-center animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4">Meet Our Qualified Instructors</h3>
          <p className="max-w-2xl mx-auto text-lg mb-6">
            Learn from experienced professionals with 5+ years in industry and academia.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Anjali Mehta', title: 'AI Specialist | 10+ Years Experience' },
              { name: 'Mr. Rahul Singh', title: 'Full Stack Developer | 7+ Years Experience' },
              { name: 'Ms. Neha Roy', title: 'Data Scientist | 8+ Years Experience' }
            ].map((teacher, i) => (
              <div
                key={i}
                className="bg-gray-800 p-6 rounded-lg shadow-md hover:bg-indigo-600 transition-colors duration-300 hover:scale-105"
              >
                <h4 className="text-xl font-semibold">{teacher.name}</h4>
                <p className="text-sm">{teacher.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Student Feedback Section */}
        <section className="animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4 text-center">What Our Students Say</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { feedback: "The best tech platform to start learning! The instructors are top-notch.", author: "- Priya Sharma, Web Dev Student" },
              { feedback: "Their AI course helped me land a job in just 3 months!", author: "- Aman Verma, AI Enthusiast" }
            ].map((quote, i) => (
              <blockquote
                key={i}
                className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-purple-600 transition-colors duration-300 hover:scale-105"
              >
                "{quote.feedback}"
                <footer className="mt-2 text-sm text-gray-400">{quote.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-center p-6 text-gray-400 text-sm animate-slide-in-up">
        © 2025 TechEd Academy. All rights reserved.
      </footer>

      {/* Tailwind CSS Keyframe Animations */}
      <style jsx>{`
        
        @tailwind utilities;
        @tailwind utilities;

        @layer utilities {
          .animate-fade-in {
            animation: fadeIn 1s ease-out;
          }
          .animate-fade-in-up {
            animation: fadeInUp 1s ease-out;
          }
          .animate-slide-in-down {
            animation: slideInDown 1s ease-out;
          }
          .animate-slide-in-up {
            animation: slideInUp 1s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; } to { opacity: 1; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInDown {
            from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideInUp {
            from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}

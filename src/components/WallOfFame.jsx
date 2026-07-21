import React from "react";
import {
  FaTrophy,
  FaGithub,
  FaExternalLinkAlt,
  FaUserCircle,
} from "react-icons/fa";

// ================= STUDENT CARD COMPONENT =================
const StudentCard = ({ title, name, projectLink, codeLink, isTop }) => {
  return (
    <div
      className={`relative bg-white/[0.02] backdrop-blur-xl border ${
        isTop
          ? "border-blue-500/40 shadow-blue-500/10"
          : "border-white/5 shadow-black/40"
      } p-8 rounded-[2rem] shadow-xl hover:-translate-y-1 hover:bg-white/[0.04] transition-all duration-300 flex flex-col items-center text-center group`}
    >
      {/* تأثير ضوئي مخفي يظهر عند تمرير الماوس */}
      <div
        className={`absolute -inset-px bg-gradient-to-r ${
          isTop
            ? "from-blue-500/10 to-indigo-500/10"
            : "from-slate-500/10 to-gray-500/10"
        } rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10`}
      />

      {/* عنوان الكارت (يظهر فقط للطالب الأول) */}
      {title && (
        <div className="absolute -top-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400 text-white text-xs font-bold uppercase tracking-wide shadow-lg shadow-blue-500/20">
          <FaTrophy className="text-blue-200" />
          {title}
        </div>
      )}

      {/* أيقونة الطالب */}
      <div className="relative mb-4">
        <div
          className={`absolute inset-0 rounded-full blur-md ${
            isTop ? "bg-blue-500/30" : "bg-slate-500/20"
          } -z-10`}
        />
        <div
          className={`flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800 shadow-inner ${
            isTop
              ? "border-2 border-blue-400/50 text-blue-400"
              : "border-2 border-white/10 text-slate-400"
          }`}
        >
          <FaUserCircle className="w-20 h-20 sm:w-24 sm:h-24 opacity-80" />
        </div>
      </div>

      {/* اسم الطالب */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">{name}</h3>

      {/* أزرار المشاريع */}
      <div className="flex flex-col w-full gap-3 mt-auto">
        <a
          href={projectLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 transition-all text-sm font-semibold"
        >
          <FaExternalLinkAlt />
          Final Project
        </a>
        <a
          href={codeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white border border-white/5 hover:border-white/20 transition-all text-sm font-semibold"
        >
          <FaGithub />
          Project Code
        </a>
      </div>
    </div>
  );
};

// ================= MAIN WALL OF FAME COMPONENT =================
export default function WallOfFame() {
  const topStudent = {
    name: "Habiba Emad",
    projectLink: "https://habibaemad20.github.io/DOUNETORY./",
    codeLink: "https://github.com/habibaemad20/DOUNETORY.",
  };

  const bestStudents = [
    {
      name: "Manar Elsayed ",
      projectLink: "https://manar103.github.io/space/",
      codeLink: "https://github.com/manar103/space",
    },
    {
      name: "Nada Alafify",
      projectLink: "https://nadaalafify.github.io/NexuxNet-NetworkingCompany/",
      codeLink:
        "https://github.com/NadaAlafify/NexuxNet-NetworkingCompany/tree/main",
    },
    {
      name: "Amr Belal",
      projectLink: "https://amrbelal4111.github.io/AmrTec/",
      codeLink: "https://github.com/amrbelal4111/AmrTec#",
    },
    {
      name: "Doaa Shehab",
      projectLink: "https://doaashehab056-collab.github.io/Stellar./",
      codeLink: "https://github.com/doaashehab056-collab/Stellar..git",
    },
    {
      name: "Basmala Mohamed",
      projectLink: "https://basmalamogamed13-cell.github.io/Website/",
      codeLink: "https://github.com/basmalamogamed13-cell/Website",
    },
    {
      name: "Bassant Fathy ",
      projectLink: "https://bassant510.github.io/First-web/",
      codeLink: "https://github.com/Bassant510/First-web.git",
    },
    {
      name: "Layla Abo Hasiba",
      projectLink: "https://liala-2003.github.io/final-project/",
      codeLink: "https://github.com/liala-2003/final-project",
    },
    {
      name: "Naglaa Khalid",
      projectLink: "https://naglaakhalid.github.io/WorkSpace/",
      codeLink: "https://github.com/Naglaakhalid/WorkSpace.git",
    },
    {
      name: "Sara Hany Mostafa ",
      projectLink: "https://sarahany6.github.io/final-project/",
      codeLink: "https://github.com/sarahany6/final-project.git",
    },

    {
      name: "Ethar AbdelHakim",
      projectLink: "https://etharhakim50-eng.github.io/sweet-treat7/",
      codeLink: "https://github.com/etharhakim50-eng/sweet-treat7.git",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-white">
          Excellence <span className="text-blue-400">Board</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Celebrating the outstanding achievements of our top performing
          students.
        </p>
      </div>

      {/* Top Student Card */}
      <div className="flex justify-center mb-16 mt-8">
        <div className="w-full max-w-md">
          <StudentCard
            title="Top Student In Level One"
            isTop={true}
            name={topStudent.name}
            projectLink={topStudent.projectLink}
            codeLink={topStudent.codeLink}
          />
        </div>
      </div>

      {/* Best Students Grid */}
      <div>
        <h3 className="text-2xl font-bold text-center mb-10 text-slate-300">
          Best Students
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {bestStudents.map((student, index) => (
            <StudentCard
              key={index}
              isTop={false}
              name={student.name}
              projectLink={student.projectLink}
              codeLink={student.codeLink}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

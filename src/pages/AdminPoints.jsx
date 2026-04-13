// import { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
// import Message from "../components/Message";

// export default function AdminPoints() {
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");

//   const fetchStudents = async () => {
//     const querySnapshot = await getDocs(collection(db, "students"));
//     const allStudents = [];
//     querySnapshot.forEach((d) => {
//       const data = d.data();
//       const totalPoints =
//         (data.points?.tasks || 0) +
//         (data.points?.attendance || 0) +
//         (data.points?.search || 0) +
//         (data.points?.bonus || 0);

//       allStudents.push({ id: d.id, ...data, totalPoints });
//     });

//     allStudents.sort((a, b) => b.totalPoints - a.totalPoints);

//     setStudents(allStudents);
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   const handleAddPoints = async (id, addedPoints) => {
//     if (!addedPoints) return;

//     const studentRef = doc(db, "students", id);
//     const studentData = students.find((s) => s.id === id);

//     const newPoints = {
//       tasks: studentData.points?.tasks || 0,
//       attendance: studentData.points?.attendance || 0,
//       search: studentData.points?.search || 0,
//       bonus: studentData.points?.bonus || 0,
//     };

//     newPoints.bonus += Number(addedPoints);

//     await updateDoc(studentRef, { points: newPoints });

//     setMessage({
//       text: `تم إضافة ${addedPoints} نقطة لـ ${studentData.Name}`,
//       type: "success",
//     });

//     fetchStudents();
//   };

//   if (loading)
//     return (
//       <p className="text-white text-center mt-20 text-xl font-semibold">
//         Loading...
//       </p>
//     );

//   const filteredStudents = students.filter((s) =>
//     s.Name.toLowerCase().includes(searchQuery.toLowerCase()),
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-950 p-6 flex flex-col items-center space-y-8">
//       <h1 className="text-2xl font-bold text-white">Manege Students Points</h1>

//       {/* Search */}
//       <input
//         type="text"
//         placeholder="Search"
//         className="w-full max-w-md p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//       />

//       {/* Students */}
//       <div className="w-full max-w-md space-y-4">
//         {filteredStudents.map((s, i) => (
//           <div
//             key={s.id}
//             className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white flex flex-col gap-3 shadow-lg transition hover:scale-[1.02] hover:bg-black/50"
//           >
//             <div className="flex justify-between items-center">
//               <span className="font-semibold">
//                 {i + 1}. {s.Name}
//               </span>

//               <span className="text-gray-300">
//                 {s.totalPoints} pts | Level {s.Level}
//               </span>
//             </div>

//             <div className="flex gap-2">
//               <input
//                 type="number"
//                 placeholder="Add Points"
//                 className="p-2 rounded-lg text-black flex-1"
//                 id={`points-${s.id}`}
//               />

//               <button
//                 className="bg-indigo-700 hover:bg-indigo-800 px-4 py-1 rounded-lg transition"
//                 onClick={() =>
//                   handleAddPoints(
//                     s.id,
//                     Number(document.getElementById(`points-${s.id}`).value),
//                   )
//                 }
//               >
//                 إضافة
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {message && (
//         <Message
//           text={message.text}
//           type={message.type}
//           onClose={() => setMessage(null)}
//         />
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

export default function AdminPoints() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValues, setInputValues] = useState({});
  const { isAdmin, loading: adminLoading } = useAdmin();

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const allStudents = [];

      querySnapshot.forEach((d) => {
        const data = d.data();

        const totalPoints =
          (data.points?.tasks || 0) +
          (data.points?.attendance || 0) +
          (data.points?.search || 0) +
          (data.points?.bonus || 0);

        allStudents.push({
          id: d.id,
          ...data,
          totalPoints,
        });
      });

      allStudents.sort((a, b) => b.totalPoints - a.totalPoints);

      setStudents(allStudents);
    } catch (error) {
      console.error("Fetch students error:", error);
      setMessage({
        text: "فشل تحميل الطلاب",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStudents();
    } else if (!adminLoading) {
      setLoading(false);
    }
  }, [isAdmin, adminLoading]);

  const handleInputChange = (id, value) => {
    setInputValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAddPoints = async (id) => {
    try {
      const addedPoints = Number(inputValues[id]);

      if (!addedPoints || addedPoints === 0) {
        setMessage({
          text: "أدخل عدد نقاط صحيح",
          type: "error",
        });
        return;
      }

      const studentRef = doc(db, "students", id);
      const studentData = students.find((s) => s.id === id);

      if (!studentData) return;

      const newPoints = {
        tasks: studentData.points?.tasks || 0,
        attendance: studentData.points?.attendance || 0,
        search: studentData.points?.search || 0,
        bonus: studentData.points?.bonus || 0,
      };

      newPoints.bonus += addedPoints;

      await updateDoc(studentRef, { points: newPoints });

      setMessage({
        text: `تم إضافة ${addedPoints} نقطة لـ ${studentData.Name}`,
        type: "success",
      });

      setInputValues((prev) => ({
        ...prev,
        [id]: "",
      }));

      fetchStudents();
    } catch (error) {
      console.error("Add points error:", error);
      setMessage({
        text: "فشل تعديل النقاط - تأكد من الصلاحيات",
        type: "error",
      });
    }
  };

  if (loading || adminLoading) {
    return (
      <p className="text-white text-center mt-20 text-xl font-semibold">
        Loading...
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-bold">
        ليس لديك صلاحية للدخول لهذه الصفحة
      </div>
    );
  }

  const filteredStudents = students.filter((s) =>
    s.Name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-950 p-6 flex flex-col items-center space-y-8">

      <h1 className="text-2xl font-bold text-white">Manage Students Points</h1>

      <input
        type="text"
        placeholder="Search by name"
        className="w-full max-w-md p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="w-full max-w-md space-y-4">
        {filteredStudents.map((s, i) => (
          <div
            key={s.id}
            className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white flex flex-col gap-3 shadow-lg transition hover:scale-[1.02] hover:bg-black/50"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">
                {i + 1}. {s.Name}
              </span>

              <span className="text-gray-300">
                {s.totalPoints} pts | Level {s.Level}
              </span>
            </div>

            <div className="text-sm text-gray-400">
              Bonus: {s.points?.bonus || 0}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Add Bonus"
                className="p-2 rounded-lg text-black flex-1"
                value={inputValues[s.id] || ""}
                onChange={(e) => handleInputChange(s.id, e.target.value)}
              />

              <button
                className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg transition"
                onClick={() => handleAddPoints(s.id)}
              >
                إضافة
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <Message
          text={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
    </div>
  );
}
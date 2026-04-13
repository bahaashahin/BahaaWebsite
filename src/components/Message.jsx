// src/components/Message.jsx
export default function Message({ text, type = "success", onClose }) {
  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  return (
    <div
      className={`${colors[type]} text-white p-3 rounded-xl fixed top-6 right-6 shadow-lg z-50`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{text}</span>
        <button onClick={onClose} className="font-bold">
          ×
        </button>
      </div>
    </div>
  );
}

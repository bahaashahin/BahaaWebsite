export default function VideoCard({ title, thumbnail, link }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-2xl overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="h-52 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${thumbnail})` }}
      ></div>

      {/* Overlay Blur Glass */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm group-hover:bg-black/50 transition"></div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
          <h3 className="text-white text-lg font-semibold group-hover:text-blue-400 transition">
            {title}
          </h3>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/40 rounded-2xl transition"></div>
    </a>
  );
}

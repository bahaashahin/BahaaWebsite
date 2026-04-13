import VideoCard from "../components/VideoCard";
import SessionOne from "../assets/sessions/session1.png";
import Sessiontwo from "../assets/sessions/session2.png";
import Sessionthree from "../assets/sessions/session3.png";
import Sessionfour from "../assets/sessions/session4.png";
import Sessionfive from "../assets/sessions/session5.png";
export default function Courses() {
  const videos = [
    {
      title: "Session 1",
      thumbnail: { SessionOne },
      link: "https://www.dropbox.com/scl/fi/td6pk91wwtzt6jhl5ikq7/Lec1.mp4?rlkey=u209wis7iiuxb4kwloyxykezg&st=gk9rbhl7&dl=0",
    },
    {
      title: "Session 2",
      thumbnail: { Sessiontwo },
      link: "https://t.me/c/3849492572/6",
    },
    {
      title: "Session 3",
      thumbnail: { Sessionthree },
      link: "https://t.me/c/3849492572/10",
    },
    {
      title: "Session 4",
      thumbnail: { Sessionfour },
      link: "https://t.me/c/3849492572/13",
    },
    {
      title: "Session 5",
      thumbnail: { Sessionfive },
      link: "https://t.me/c/3849492572/14",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6">
      <div className="mb-20"></div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
        📚 Courses
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <VideoCard
            key={index}
            title={video.title}
            thumbnail={video.thumbnail}
            link={video.link}
          />
        ))}
      </div>
    </div>
  );
}

import clsx from "clsx";

// eslint-disable-next-line react/prop-types
const Scoreboard = ({ teams, points, BOLength, gameEnded, winner }) => (
  <div className='flex items-center'>
    <div className="w-96 pl-8 h-16 bg-team1 text-3xl font-extrabold relative -right-12 pr-12 flex items-center justify-center rounded-l-lg text-black">
      <div className={clsx(gameEnded && winner === teams[0] ? "animate-wiggle" : "")}>{teams[0] || "Equipe 1"}</div>
    </div>
    <div className="trapezoid flex items-center justify-center text-3xl font-bold text-white z-10 relative">
      <div className="-mt-1">{points[0] || 0} - {points[1] || 0}</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 italic text-xs font-normal">BO{BOLength}</div>
    </div>
    <div className="w-96 pr-8 h-16 bg-team2 text-3xl font-extrabold relative  right-12 pl-12 flex items-center justify-center rounded-r-lg text-white">
      <div className={clsx(gameEnded && winner === teams[1] ? "animate-wiggle" : "")}>{teams[1] || "Equipe 2"}</div>
    </div>
  </div>
)

export default Scoreboard;

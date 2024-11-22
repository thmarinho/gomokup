import clsx from 'clsx';
import { useEffect, useState } from 'react'
import Star from './Star';
import ConfettiExplosion from 'react-confetti-explosion';

const GRID_SIZE = 20

function App() {
  const [moves, setMoves] = useState([])
  const [BOLength, setBOLength] = useState(0)
  const [teams, setTeams] = useState([])
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState(null)
  const [points, setPoints] = useState([])
  const [paused, setPaused] = useState(false)
  const [winningCells, setWinningCells] = useState([])
  const [maxMoves, setMaxMoves] = useState(GRID_SIZE ** 2 + 1)
  const [socket, setSocket] = useState(null)


  useEffect(() => {
    setSocket(new WebSocket('ws://localhost:8765'))
  }, []);

  useEffect(() => {
    if (!socket) return
    socket.send('PAUSE')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  useEffect(() => {
    if (!socket) return

    socket.onmessage = (event) => {
      const data = event.data;

      // ANNOUNCEMENT
      // Coordonnées victore
      // start
      // etoiles

      // START;NOM_EQUIPE_1;NOM_EQUIPE_2;LONGUEUR_DU_BO;PTS_TEAM1;PTS_TEAM2
      if (data.startsWith('START')) {
        const [, team1, team2, _BOLength, ptsTeam1, ptsTeam2] = data.split(';')

        setMoves([])
        setBOLength(_BOLength)
        setTeams([team1, team2])
        setGameEnded(false)
        setWinner(null)
        setPoints([ptsTeam1, ptsTeam2])
      }


      // TURN;X;Y;EQUIPE
      if (data.startsWith('TURN')) {
        const [, x, y, team, delay] = data.split(';');
        const move = { x: parseInt(x), y: parseInt(y), team, delay };

        setMoves((prevMoves) => [...prevMoves, move]);
      }

      // END;EQUIPE_GAGNANTE/TIE;[POS_X;POS_Y;POS_X;POS_Y]
      if (data.startsWith('END')) {
        const [, team, startX, startY] = data.split(';');

        setGameEnded(true);

        if (team === 'TIE') {
          setWinner(null);
        } else {
          setWinner(team);
          // Get winning cells
        }
      }
    }

    return () => {
      socket.close();
    }
  }, [socket])

  return (
    <div className="h-screen w-screen bg-gray-50">
      <div className='absolute top-0 left-0'>{winner && <ConfettiExplosion particleCount={150} />}</div>
      <div className='absolute top-0 left-1/4'>{winner && <ConfettiExplosion particleCount={150} />}</div>
      <div className='absolute top-0 left-1/2'>{winner && <ConfettiExplosion particleCount={150} />}</div>
      <div className='absolute top-0 left-3/4'>{winner && <ConfettiExplosion particleCount={150} />}</div>
      <div className='absolute top-0 right-0'>{winner && <ConfettiExplosion particleCount={150} />}</div>
      <button onClick={() => setPaused(old => !old)}>{paused ? "pas pause" : "pause"}</button>
      <div className="flex flex-col justify-center items-center gap-12">
        <div className=''>
          <div className='flex justify-center gap-6 items-center w-full pt-3 pb-1'>
            <div className='font-bold text-xl'>{points[0]}</div>
            <div className={clsx('text-2xl font-extrabold bg-[#1ABC9C] py-2 px-4 rounded-lg', (gameEnded && winner === teams[0]) && 'scale-125 animate-wiggle')}>{teams[0]} </div>
            <img src="/vs.png" className='h-12' alt="versus" />
            <div className={clsx('text-2xl font-extrabold bg-[#2C3D50] text-white py-2 px-4 rounded-lg', (gameEnded && winner === teams[1]) && 'scale-125 animate-wiggle')}>{teams[1]} </div>
            <div className='font-bold text-xl'>{points[1]}</div>

            {/* <span className='text-2xl font-extrabold bg-[#2C3D50] py-2 px-4 rounded-lg text-white'>{teams[1]}</span> */}
          </div>
          <p className='text-center italic text-sm text-gray-500'>BO{BOLength}</p>
        </div>
        <div className='flex flex-col'>
          <div className='bg-white shadow-lg p-2 rounded-xl w-fit mx-auto flex divide-x gap-8 h-[41rem]'> {/* 2rem per cell + 0.5rem padding */}
            <div>
              {Array(GRID_SIZE).fill('').map((_, rowIndex) => (
                <div className="flex" key={rowIndex}>
                  {Array(GRID_SIZE).fill('').map((_, colIndex) => (
                    <div
                      className="h-8 aspect-square flex items-center justify-center relative"
                      key={`${rowIndex}-${colIndex}`}
                    >
                      <div className={clsx(
                        'absolute border-[1px] h-8 aspect-square top-1/2 left-1/2',
                        (colIndex === GRID_SIZE - 1 || rowIndex === GRID_SIZE - 1) && 'hidden'
                      )}></div>
                      <>
                        {(() => {
                          const moveIdxFound = moves.findIndex((move) => move.x === rowIndex && move.y === colIndex)
                          const moveFound = moves[moveIdxFound]


                          if (moveIdxFound === undefined || !moveFound || moveIdxFound > maxMoves)
                            return ''

                          return <div className={clsx('h-6 aspect-square rounded-full z-10 flex items-center justify-center', moveFound.team === teams[0] ? 'bg-[#1ABC9C]' : 'bg-[#2C3D50]')}>
                            {winningCells.find(cell => cell.x === rowIndex && cell.y === colIndex)
                              ? <Star className="h-3.5 text-yellow-400 animate-wiggle" />
                              : ''
                            }
                          </div>
                        })()}
                      </>
                    </div>
                  ))}
                </div>
              ))}

            </div>
            <div className='h-full overflow-hidden flex flex-col gap-2 pl-8 pr-6'>
              <span className='text-gray-700'>Derniers coups</span>
              <div className='flex flex-col gap-2'>
                {(moves.slice(0, (parseInt(maxMoves) + 1)).reverse()).map((move, idx) => (
                  <div key={idx} className='grid grid-cols-4 gap-2 place-items-center text-sm text-gray-500 px-2 py-1 first:bg-[#3E505B] first:text-white first:shadow-md rounded-lg group'>
                    <div className={clsx('h-4 aspect-square rounded-full z-10 flex items-center justify-center', move.team === teams[0] ? 'bg-[#1ABC9C]' : 'bg-[#2C3D50]')}></div>
                    <div>{move.x}</div>
                    <div>{move.y}</div>
                    <div className='text-[0.625rem]'>{move.delay || -1}ms</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='text-gray-500 gap-3 flex items-center justify-center w-full px-16 mt-4'>
            <span>1</span>
            <input disabled={!gameEnded} className='flex-grow accent-[#3E505B]' type="range" min={0} max={moves.length - 1} onChange={(e) => setMaxMoves(e.target.value)} value={maxMoves} />
            <span>{moves.length}</span>
          </div>

        </div>
      </div>
    </div >
  )
}

export default App

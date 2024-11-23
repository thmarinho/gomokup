import clsx from 'clsx';
import { useEffect, useState } from 'react'
import Star from './Star';
import ConfettiExplosion from 'react-confetti-explosion';
import BreakingNews from './BreakingNews';
import Scoreboard from './Scoreboard';

const GRID_SIZE = 20

function App() {
  const [moves, setMoves] = useState([])
  const [BOLength, setBOLength] = useState(0)
  const [teams, setTeams] = useState([])
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState(null)
  const [points, setPoints] = useState([])
  const [gamePaused, setGamePaused] = useState(false)
  const [winningCells, setWinningCells] = useState([])
  const [maxMoves, setMaxMoves] = useState(GRID_SIZE ** 2 + 1)
  const [socket, setSocket] = useState(null)
  const [announcement, setAnnoncement] = useState(null)

  function findWinningCells() {
    const board = {};
    const directions = [
        { dx: 0, dy: 1 },  // Horizontal
        { dx: 1, dy: 0 },  // Vertical

        { dx: 1, dy: 1 },  // Diagonal (down-right)
        { dx: -1, dy: 1 }  // Diagonal (up-right)
    ];


    // Fill the board with moves
    moves.forEach(move => {
        if (!board[move.x]) board[move.x] = {};
        board[move.x][move.y] = move.team;
    });

    // Helper function to check a direction
    function checkDirection(x, y, dx, dy, team) {
        const winningCells = [];
        for (let i = 0; i < 5; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (board[nx]?.[ny] === team) {
                winningCells.push({ x: nx, y: ny });
            } else {
                return null; // Sequence breaks
            }
        }
        return winningCells; // Return the winning sequence
    }

    // Search for a winning sequence
    for (const move of moves) {
        const { x, y, team } = move;

        for (const { dx, dy } of directions) {
            const result = checkDirection(x, y, dx, dy, team);
            if (result) {
                return result; // Return the winning cells if found
            }
        }
    }

    return null; // No winning sequence found
}

  useEffect(() => {
    setSocket(new WebSocket('ws://localhost:8765'))
  }, []);

  useEffect(() => {
    if (!socket)
      return

    if (!gamePaused)
      setMaxMoves(GRID_SIZE ** 2 + 1)

    socket.send('PAUSE')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePaused])

  useEffect(() => {
    if (gameEnded && winner)
      setWinningCells(findWinningCells())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameEnded])

  useEffect(() => {
    if (!socket) return

    socket.onmessage = (event) => {
      const data = event.data;

      // start btn
      // timer

      // START;NOM_EQUIPE_1;NOM_EQUIPE_2;LONGUEUR_DU_BO;PTS_TEAM1;PTS_TEAM2
      if (data.startsWith('START')) {
        const [, team1, team2, _BOLength, ptsTeam1, ptsTeam2] = data.split(';')

        setMoves([])
        setBOLength(_BOLength)
        setTeams([team1, team2])
        setGameEnded(false)
        setWinner(null)
        setPoints([ptsTeam1, ptsTeam2])
        setGamePaused(false)
        setWinningCells([])
        setMaxMoves(GRID_SIZE ** 2 + 1)
        setAnnoncement(null)
      }

      // ANNONCEMENT;MESSAGE
      if (data.startsWith('ANNONCEMENT')) {
        const [, message] = data.split(';')

        setAnnoncement(message)
        setTimeout(() => {
          setAnnoncement(null)
        }, (5000));
      }

      // TURN;X;Y;EQUIPE
      if (data.startsWith('TURN')) {
        const [, x, y, team, delay] = data.split(';');
        const move = { x: parseInt(x), y: parseInt(y), team, delay };

        setMoves((prevMoves) => [...prevMoves, move]);
      }

      // END;EQUIPE_GAGNANTE/TIE;[POS_X;POS_Y;POS_X;POS_Y]
      if (data.startsWith('END')) {
        const [, team] = data.split(';');

        setGameEnded(true);
        // Winning cells set in useEffect above

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
      <button onClick={() => setGamePaused(old => !old)}>{gamePaused ? "pas pause" : "pause"}</button>
      <div className="flex flex-col justify-center items-center gap-12">
        <Scoreboard teams={teams} points={points} BOLength={BOLength} gameEnded={gameEnded} winner={winner} />
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

                          return <div className={clsx('h-6 aspect-square rounded-full z-10 flex items-center justify-center', moveFound.team === teams[0] ? 'bg-team1' : 'bg-team2')}>
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
                  <div key={idx} className='grid grid-cols-3 gap-2 place-items-center text-sm text-gray-500 px-2 py-1 first:bg-accent first:text-white first:shadow-md rounded-lg group'>
                    <div className={clsx('h-4 aspect-square rounded-full z-10 flex items-center justify-center', move.team === teams[0] ? 'bg-team1' : 'bg-team2')}></div>
                    <div>({move.x}:{move.y})</div>
                    <div className='text-[0.625rem]'>{move.delay || -1}ms</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='text-gray-500 gap-3 flex items-center justify-center w-full px-16 mt-4'>
            <span>1</span>
            <input disabled={gamePaused === false && gameEnded === false} className='flex-grow accent-accent' type="range" min={0} max={moves.length - 1} onChange={(e) => setMaxMoves(e.target.value)} value={maxMoves} />
            <span>{moves.length}</span>
          </div>

        </div>
      </div>
      {announcement && <BreakingNews message={announcement} />}
    </div >
  )
}

export default App

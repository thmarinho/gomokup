import sys

import websockets
import asyncio

import subprocess
import threading
from queue import Queue, Empty

global pause_status, ready
pause_status = False
ready = False

# Define the WebSocket server handler
class WebSocketServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.server = None
        self.clients = set()

    async def handler(self, websocket):
        """Handle incoming WebSocket connections."""
        print("A client connected!")
        global pause_status, ready
        self.clients.add(websocket)
        try:
            async for message in websocket:
                print(f"Received message: {message}")
                if message == 'PAUSE':
                    pause_status = not pause_status
                elif message == 'READY':
                    ready = True
        except websockets.ConnectionClosed:
            print("A client disconnected!")
        finally:
            self.clients.remove(websocket)

    async def start(self):
        """Start the WebSocket server."""
        print(f"Starting WebSocket server on ws://{self.host}:{self.port}")
        self.server = await websockets.serve(self.handler, self.host, self.port)
        print("WebSocket server started.")

    async def stop(self):
        """Stop the WebSocket server."""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            print("WebSocket server stopped.")

    async def send_message(self, message):
        """Send a message to all connected clients."""
        if not self.clients:
            print("No clients connected.")
            return None

        print(f"Sending message to {len(self.clients)} client(s): {message}")
        await asyncio.gather(*(client.send(message) for client in self.clients))
        return True


class Binary:
    def __init__(self, path, *args):
        """Initialize the binary process."""
        self.process = subprocess.Popen(
            [path, *args],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,  # Use strings instead of bytes
            bufsize=1   # Line-buffered output
        )
        self.output_queue = Queue()
        self.error_queue = Queue()

        # Start threads to read stdout and stderr
        self.stdout_thread = threading.Thread(
            target=self._read_stream, args=(self.process.stdout, self.output_queue)
        )
        self.stderr_thread = threading.Thread(
            target=self._read_stream, args=(self.process.stderr, self.error_queue)
        )
        self.stdout_thread.start()
        self.stderr_thread.start()

    def _read_stream(self, stream, queue):
        """Read the process stream and store it in a queue."""
        for line in iter(stream.readline, ''):
            queue.put(line.strip())
        stream.close()

    def stdout(self, input_data):
        """Send input to the process."""
        if self.process.stdin:
            self.process.stdin.write(input_data + '\n')
            self.process.stdin.flush()

    def stdin(self, timeout=None):
        """Read output from the process."""
        try:
            return self.output_queue.get(timeout=timeout)
        except Empty:
            return None

    def stderr(self, timeout=None):
        """Read error output from the process."""
        try:
            return self.error_queue.get(timeout=timeout)
        except Empty:
            return None

    def terminate(self):
        """Terminate the process and clean up."""
        if self.process:
            self.process.terminate()
            self.stdout_thread.join()
            self.stderr_thread.join()
            self.process.wait()

class Gomoku:
    def __init__(self):
        self.board = []
        for _ in range(20):
            self.board.append([0]*20)

    def __this_pos(self, i, j, type):
        if (self.board[i][j - 2] == type and self.board[i][j - 1] == type and self.board[i][j + 1] == type and self.board[i][j + 2] == type):
            return (True)
        elif (self.board[i - 2][j] == type and self.board[i - 1][j] == type and self.board[i + 1][j] == type and self.board[i + 2][j] == type):
            return (True)
        elif (self.board[i - 2][j - 2] == type and self.board[i - 1][j - 1] == type and self.board[i + 1][j + 1] == type and self.board[i + 2][j + 2] == type):
            return (True)
        elif (self.board[i + 2][j - 2] == type and self.board[i + 1][j - 1] == type and self.board[i - 1][j + 1] == type and self.board[i - 2][j + 2] == type):
            for x in self.board:
                print(x)
            return (True)
        else:
            return (False)

    def check_victory(self):
        for i in range(2, len(self.board) - 2):
            for j in range(2, len(self.board[i]) - 2):
                if (self.board[i][j] == 1 and self.__this_pos(i, j, 1) == True):
                    return (True)
                elif (self.board[i][j] == 2 and self.__this_pos(i, j, 2) == True):
                    return (True)
        return (False)

    def check_tie(self):
        for i in self.board:
            if 0 in i:
                return True
        return False

from dataclasses import dataclass

@dataclass
class Player:
    score: int
    binary: Binary = None
    name: str = None

from time import time
from math import ceil

async def main(bin1, bin2, bo):
    global pause_status, ready
    server = WebSocketServer()
    await server.start()
    while len(server.clients) == 0:
        await asyncio.sleep(1)
    i = -1
    p1 = Player(0, Binary(bin1), '')
    p1.binary.stdout('ABOUT')
    p1.name = p1.binary.stdin(timeout=5).split('"')[1]
    p2 = Player(0, Binary(bin2), '')
    p2.binary.stdout('ABOUT')
    p2.name = p2.binary.stdin(timeout=5).split('"')[1]
    await server.send_message(f'INFO;{p1.name};{p2.name};{bo}')
    players = [p1, p2]

    while (True):
        p1.binary = Binary(bin1)
        p2.binary = Binary(bin2)
        i = (i + 1) % 2
        while ready == False or pause_status == True:
            await asyncio.sleep(0.1)
        game = Gomoku()
        p1.binary.stdout('START 20')
        p2.binary.stdout('START 20')
        start = time()
        players[i].binary.stdout('BEGIN')
        players[(i+1)%2].binary.stdin(timeout=5)
        players[i].binary.stdin(timeout=5)
        delay = time() - start
        res = players[i].binary.stdin(timeout=5)
        if res != None and ',' in res and len(res) < 6 and len(res) > 2:
            x,y = map(int, res.split(','))
            game.board[x][y] = i+1
            await server.send_message(f'TURN;{x};{y};{players[i].name};{int(delay*1000)}')
        else:
            await server.send_message(f'ANNONCEMENT;TIMEOUT;{players[i].name}')
            pass
        i = (i + 1) % 2
        plays = 1
        while (game.check_victory() == False and plays < 400):
            while pause_status == True:
                await asyncio.sleep(0.1)
            players[i].binary.stdout(f'TURN {res}')
            start = time()
            res = players[i].binary.stdin(timeout=5)
            delay = time() - start
            await asyncio.sleep(min(0.8, plays/250 - delay))
            if res != None and ',' in res and len(res) < 6 and len(res) > 2:
                x,y = map(int, res.split(','))
                if game.board[x][y] == 0:
                    await server.send_message(f'TURN;{x};{y};{players[i].name};{int(delay*1000)}')
                    game.board[x][y] = i+1
                else:
                    await server.send_message(f'ANNONCEMENT;TRICHEUR')
                    break
            else:
                await server.send_message(f'ANNONCEMENT;TIMEOUT')
                break
            i = (i + 1) % 2
            plays += 1
        if plays != 400:
            players[i].score += 1
        ready = False
        try:
            p1.binary.stdout('END')
            p2.binary.stdout('END')
        except:
            pass

        if p1.score == (bo+1)/2 or p2.score == (bo+1)/2:
            print(f'{players[(i+1)%2].name} WON the BO.')
            await server.send_message(f'END;{players[(i+1)%2].name};{p2.score};{p1.score};{game.check_victory()}')
            await server.send_message(f'ANNONCEMENT;{players[(i+1)%2].name} WON THE GAME')
            break
        elif plays == 400:
            await server.send_message(f'ANNONCEMENT;TIE')
            await server.send_message(f'END;TIE')
        else:
            await server.send_message(f'END;{players[(i+1)%2].name};{p2.score};{p1.score};{game.check_victory()}')

    await server.stop()
    return

if len(sys.argv) != 4:
    raise Exception('Not enough arguments - binary1 binary2 bo_lenght')
else:
    try:
        asyncio.run(main(sys.argv[1], sys.argv[2], int(sys.argv[3])))
    finally:
        pass


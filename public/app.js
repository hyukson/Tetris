(function () {
  const Game = {
    shape: [],
    board: [],
    position: { shapeX: 3, shapeY: 0 },
    data: {
      score: 0,
      line: 0,
      hold: [],
      isHold: false,
      isGame: false,
    },

    // 초기 설정
    init() {
      Board.$canvas = document.querySelector("#main");
      Board.ctx = Board.$canvas.getContext("2d");
      
      // 게임시작 버튼
      document.querySelector(".button").onclick = (e) => {
        if (!Game.data.isGame) {
		      Game.data.isGame = true;

          Game.startTimer();
        }
      };
    },

    // 이벤트 관리
    hook() {
      // 각종 키를 눌렀을 때
      const press = {};

      // 한번의 키 다운을 허용
      let oneKeyDown = false;

      // 이동 키코드값 저장
      const moveDir = {
        left: [37],
        right: [39],
        down: [40],
        rotateL: [90],
        rotateR: [38, 88],
        drop: [32],
        hold: [67],
      };

      window.onkeydown = (e) => {
        if (!Game.data.isGame) {
          return;
        }

        // 연속해서 누르기 방지
        if ([90, 38, 88, 32].includes(e.keyCode)) {
          if (!oneKeyDown) {
            oneKeyDown = true;

            for (const dir in moveDir) {
              moveDir[dir].includes(e.keyCode) && Game.moveShape(dir);
            }
          }

          return;
        }

        if (press[e.keyCode]) {
        	return;
        }

        for (const dir in moveDir) {
          if (moveDir[dir].includes(e.keyCode)) {
          	Game.moveShape(dir);

          	clearInterval(press[e.keyCode]);

          	press[e.keyCode] = setInterval(() => Game.moveShape(dir), 70);
          	break;
          };
        }
      };

      window.onkeyup = (e) => {
        oneKeyDown = false;

        clearInterval(press[e.keyCode]);

        press[e.keyCode] = 0;
      };
    },

    // 시작 카운트 다운
    startTimer(now = 4) {
      const { width, height } = Board.$canvas;
      const ctx = Board.ctx;

      ctx.clearRect(0, 0, width, height);

      const text = now === 1 ? "GAME START" : now - 1;

      ctx.fillStyle = "#febf00";
      ctx.font = "60px Pretendard";

      ctx.beginPath();
      // 텍스트 가운데로
      ctx.textAlign = "center";
      ctx.fillText(text, width / 2, height / 2);
      ctx.fill();
      ctx.closePath();

      if (!now) {
        Game.start();
        return;
      }

      setTimeout(() => Game.startTimer(now - 1), 1000);
    },

    // 게임시작
    start() {
      Game.hook();

      Timer.start();

      Game.newMake();
    },

    // 새로운 게임 설정
    newMake() {
      Game.board = Array.from({ length: 20 }, () => Array(10).fill(0));

      // 랜덤한 모양 받기
      Shape.nextShapeStack();

      // 초기 설정
      Game.data = {
        score: 0,
        line: 0,
        hold: [],
        isHold: false,
        isGame: true,
      };

      Game.viewInfo();

      Board.draw();

      window.requestAnimationFrame(() => Game.loop(new Date()));
    },

    // 게임 루프
    loop(start) {
      const now = new Date();

      const nowSpeed = 500 - Game.data.line * 20;

      const speed = nowSpeed > 100 ? nowSpeed : 100;

      if (speed <= now - start) {
        Game.moveShape("down");

        start = now;
      }

      if (Game.data.isGame) {
        window.requestAnimationFrame(() => Game.loop(start));
      }
    },

    // 0.5 초마다 블럭 이동
    moveShape(type) {
      const { shape, position } = Game;

      clearTimeout(Game.handle);

      // 부가적인 단축키
      if (Shape[type]) {
        Shape[type]({ shape, ...position });
        Board.draw();
        return;
      }

      const [moveX, moveY] = {
        left: [-1, 0],
        right: [1, 0],
        down: [0, 1],
      }[type];

      const movePos = {
        shapeX: position.shapeX + moveX,
        shapeY: position.shapeY + moveY,
      };

      // 충돌 감지
      if (Shape.collisionDetection({ ...movePos, shape })) {
        Game.position = movePos;
      } else if (
        // 한번더 아래로 이동할 수 있을 시
        !Shape.collisionDetection({
          ...position,
          shapeY: position.shapeY + 1,
          shape,
        }) &&
        moveY > 0 // 다운일때만
      ) {
        // 더이상 이동 불가 시 고정시키기
        // 추가의 이동을 위한 0.3초 딜레이
        Game.handle = setTimeout(() => {
          Shape.freeze({ ...position, shape });
        }, 300);
      }

      Board.draw();
    },

    // 라인 제거
    lineClear() {
      let line = 0;

      while (true) {
        const lineY = Game.board.findIndex((row) => row.every((v) => v));

        if (lineY === -1) {
          break;
        }

        Game.board.splice(lineY, 1);

        Game.board.unshift(Array(10).fill(0));

        line++;
      }

      // 각 한번에 지우는 Line에 0, 100, 250, 500, 800
      Game.data.score += [0, 100, 250, 500, 800][line];
      Game.data.line += line;

      Game.viewInfo();
    },

    // 현재 데이터 보여주기
    viewInfo() {
      document.querySelector(".score h2").innerHTML = Game.data.score;
      document.querySelector(".line h2").innerHTML = Game.data.line;
    },

    // 게임 오버
    over() {
      Game.data.isGame = false;

      Timer.stop();

      alert(
        `총 ${Game.data.line}을 지웠으며, ${Game.data.score}점을 흭득하였습니다.`
      );

      if (confirm("다시 게임을 진행하시겠습니까?")) {
        Game.startTimer();
      }
    },
  };

  const Shape = {
    stack: [],

    // 모양 모음
    tets: [
      [
        // T
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        // L
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ],
      [
        // J
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
      ],
      [
        // O
        [4, 4],
        [4, 4],
      ],
      [
        // S
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
      ],
      [
        // Z
        [6, 6, 0],
        [0, 6, 6],
        [0, 0, 0],
      ],
      [
        // I
        [0, 0, 0, 0],
        [7, 7, 7, 7],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],

    // 제일 아래로 이동시켜 고정
    drop({ shape, shapeX, shapeY }) {
      const maxY = Shape.getFreezePosition({ shapeX, shapeY, shape });

      // 원래는 findIndex를 사용할려고 했음
      Shape.freeze({ shapeX, shapeY: maxY, shape });
    },

    // 현재의 X위치에서 최대로 이동할 수 있는 Y좌표
    getFreezePosition({ shapeX, shapeY, shape }) {
      // 하나의 블록이라도 남아있을 y 위치를 찾기
      while (Shape.collisionDetection({ shapeX, shapeY, shape })) {
        shapeY++;
      }

      return shapeY - 1;
    },

    // 모양 저장
    hold({ shape }) {
      // 이미 한번 홀드 기회를 사용할 시 제한
      if (Game.data.isHold) {
        return;
      }

      // 고유의 아이디 찾아서 모양 가져오기
      const shapeId = shape.flat().find((v) => v);

      // 전에 홀드된 모양이 존재할 시 체인지
      if (Game.data.hold.length) {
        Shape.stack.unshift(Game.data.hold);
      }

      // 홀드 저장 및 제한 걸기
      Game.data = {
        ...Game.data,
        hold: [...Shape.tets[shapeId - 1]],
        isHold: true,
      };

      Shape.nextShapeStack();

      // 홀드된 정보 그리기
      Board.drawHoldShape({ shape: Game.data.hold });
    },

    // 모양 고정
    freeze({ shapeX, shapeY, shape }) {
      shape.forEach((row, y) =>
        row.forEach((data, x) => {
          // 비어있는 공간은 패스
          if (!data) {
            return true;
          }

          const xPos = shapeX + x;
          const yPos = shapeY + y;

          Game.board[yPos][xPos] = data;
        })
      );

      // 게임 오버
      if (Game.board[1].slice(3, 7).filter((v) => v).length > 1) {
        return Game.over();
      }

      // 홀드 제한 풀기
      Game.data.isHold = false;

      // 다음 모양으로 넘어가기
      Shape.nextShapeStack();

      // 꽉찬 한 라인을 제거
      Game.lineClear();
    },

    // 왼쪽으로 모양 뒤집기
    rotateL({ shape }) {
      Shape.rotateChk(
        shape[0].map((_, i) => [...shape].map((tet) => tet[i])).reverse()
      );
    },

    // 오른쪽으로 모양 뒤집기
    rotateR({ shape }) {
      const tmpShape = [...shape].reverse();

      Shape.rotateChk(tmpShape[0].map((_, i) => tmpShape.map((tet) => tet[i])));
    },

    // 바꾼 모양이 적용되어도 되는지 체크
    rotateChk(shape) {
      const { shapeX } = Game.position;

      // 회전된 상태에서 비어있는 공간 만큼 추가, 감소 되는 버그 해결
      const limitX = Board.xMax - shape.length;

      Game.position.shapeX = shapeX < 0 ? 0 : limitX < shapeX ? limitX : shapeX;

      // 모양이 둘러싸여 더 이상 회전을 못할 때 가능 위치로 조정
      while (true) {
        if (Shape.collisionDetection({ ...Game.position, shape })) {
          Game.shape = shape;
          break;
        }

        Game.position.shapeY--;
      }
    },

    // 충돌 감지
    collisionDetection({ shapeX, shapeY, shape }) {
      return shape.every((row, y) =>
        row.every((data, x) => {
          const xPos = shapeX + x;
          const yPos = shapeY + y;

          // 비어있는 공간은 패스, 이동할 공간이 비어있는 경우
          return !data || Game.board[yPos]?.[xPos] === 0;
        })
      );
    },

    // 다음에 나올 모양 리스트
    nextShapeStack() {
      // 새로운 7개의 조합 추가하기
      if (Shape.stack.length < 6) {
        Shape.stack = [
          ...Shape.stack,
          ...[...Shape.tets].sort((_) => Math.random() - 0.5),
        ];
      }

      // 위치 초기화
      Game.position = { shapeX: 3, shapeY: 0 };

      Game.shape = Shape.stack.shift();

      // 다음에 나올 모양 표시
      Board.drawNextShape();
    },

    // 랜덤으로 모양을 뽑아서 반환
    getRandomShape() {
      return Shape.tets[Math.floor(Math.random() * Shape.tets.length)];
    },
  };

  const Board = {
    $canvas: "",
    ctx: "",
    colors: [
      "#000",
      "#af298a", // T
      "#e35b02", // L
      "#2141c6", // J
      "#e39f02", // O
      "#59b101", // S
      "#d70f37", // Z
      "#0f9bd7", // I

      // opacity
      "#571445", // T
      "#712d01", // L
      "#102063", // J
      "#714f01", // O
      "#2c5800", // S
      "#6b071b", // Z
      "#074d6b", // I
    ],
    xMax: 10,
    yMax: 20,

    // 그리기
    draw() {
      const { $canvas, ctx, xMax, yMax } = Board;

      const { width, height } = $canvas;

      const { shape, position } = Game;

      const boxSize = { boxWidth: width / 10, boxHeight: height / 20 };

      ctx.clearRect(0, 0, width, height);

      // 배경 선그리기
      Board.drawLine({ ctx, width, height, ...boxSize, xMax, yMax });

      // 현재의 모양이 고정될 위치
      Board.drawNowShapeFreeze({ ctx, shape, ...position, ...boxSize });

      // 현재 진행중인 모양 그리기
      Board.drawShape({ ctx, shape, ...position, ...boxSize });

      // 고정된 모양 그리기
      Board.drawFreeze({ ctx, board: Game.board, ...boxSize });
    },

    // 선그리기
    drawLine({ ctx, width, height, boxWidth, boxHeight, xMax, yMax }) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";

      for (let i = 0; i < xMax; i++) {
        ctx.beginPath();
        ctx.moveTo(i * boxWidth, 0);
        ctx.lineTo(i * boxWidth, height);
        ctx.stroke();
        ctx.closePath();
      }

      for (let i = 0; i < yMax; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * boxHeight);
        ctx.lineTo(width, i * boxHeight);
        ctx.stroke();
        ctx.closePath();
      }
    },

    // 현재의 모양 그리기
    drawShape({ ctx, shape, shapeX = 0, shapeY = 0, boxWidth, boxHeight }) {
      shape.forEach((row, y) => {
        row.forEach((v, x) => {
          if (!v) {
            return;
          }

          ctx.fillStyle = Board.colors[v];

          const xPos = (shapeX + x) * boxWidth;
          const yPos = (shapeY + y) * boxHeight;

          ctx.beginPath();
          ctx.fillRect(xPos, yPos, boxWidth, boxHeight);
          ctx.closePath();
        });
      });
    },

    // 현재의 모양이 고정 될 예시
    drawNowShapeFreeze({ ctx, shape, shapeX, shapeY, boxWidth, boxHeight }) {
      const maxY = Shape.getFreezePosition({ shapeX, shapeY, shape });

      // 현재의 위치 그리기
      Board.drawShape({
        ctx,
        shape: shape.map((v) => v.map((x) => x && x + 7)),
        shapeX,
        shapeY: maxY,
        boxWidth,
        boxHeight,
      });
    },

    // 고정된 블럭 그리기
    drawFreeze({ ctx, board, boxWidth, boxHeight }) {
      board.forEach((row, y) => {
        row.forEach((v, x) => {
          if (!v) {
            return;
          }

          ctx.fillStyle = Board.colors[v];

          const xPos = x * boxWidth;
          const yPos = y * boxHeight;

          ctx.beginPath();
          ctx.fillRect(xPos, yPos, boxWidth, boxHeight);
          ctx.closePath();
        });
      });
    },

    // 다음에 나올 블럭 그리기
    drawNextShape() {
      const $canvas = document.querySelector("#nextShape");
      const ctx = $canvas.getContext("2d");

      const { width, height } = $canvas;

      ctx.clearRect(0, 0, width, height);

      const boxSize = {
        boxWidth: width / 6,
        boxHeight: height / 15,
      };

      Shape.stack.forEach((tet, i) => {
        Board.drawShape({
          ctx,
          shape: tet,
          shapeX: 3 - tet.length / 2,
          shapeY: 2 * i + i + 0.2,
          ...boxSize,
        });
      });
    },

    // 저장된 블럭 표시
    drawHoldShape({ shape }) {
      const $canvas = document.querySelector("#holdShape");
      const ctx = $canvas.getContext("2d");

      const { width, height } = $canvas;

      ctx.clearRect(0, 0, width, height);

      const boxSize = {
        boxWidth: width / 6,
        boxHeight: height / 4,
      };

      Board.drawShape({
        ctx,
        shape,
        shapeX: 3 - shape.length / 2,
        shapeY: 1,
        ...boxSize,
      });
    },
  };

  const Timer = {
    handle: 0,

    // 타아머 시작
    start() {
      Timer.startTime = new Date();

      window.requestAnimationFrame(Timer.interval);
    },

    // 반복
    interval() {
      const now = (new Date() - Timer.startTime) / 1000;

      const second = String(Math.floor(now % 60)).padStart(2, 0);
      const minute = Math.floor(now / 60);

      const fixed = now.toFixed(3).split(".").pop();

      document.querySelector(
        ".timer h2"
      ).innerHTML = `${minute}:${second}<span>.${fixed}</span>`;

      Timer.handle = window.requestAnimationFrame(Timer.interval);
    },

    // 타이머 중지
    stop() {
      window.cancelAnimationFrame(Timer.handle);
    },
  };

  window.onload = () => {
    Game.init();
  };
})();

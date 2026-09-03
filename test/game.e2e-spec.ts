import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_POSITION } from 'chess.js';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';

const FOOLS_MATE = [
  { from: 'f2', to: 'f3' },
  { from: 'e7', to: 'e5' },
  { from: 'g2', to: 'g4' },
  { from: 'd8', to: 'h4' }
];

describe('GameController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const createGame = async (): Promise<string> => {
    const response = await request(app.getHttpServer()).post('/games').expect(201);
    return response.body.id;
  };

  const play = async (id: string, moves: { from: string; to: string }[]) => {
    let response!: request.Response;
    for (const move of moves) {
      response = await request(app.getHttpServer()).post(`/games/${id}/moves`).send(move).expect(200);
    }
    return response;
  };

  it('creates a game at the starting position', async () => {
    const response = await request(app.getHttpServer()).post('/games').expect(201);

    expect(response.body).toMatchObject({ fen: DEFAULT_POSITION, turn: 'w', status: 'in_progress', result: null, history: [] });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('reads back a created game', async () => {
    const id = await createGame();

    const response = await request(app.getHttpServer()).get(`/games/${id}`).expect(200);

    expect(response.body.id).toBe(id);
  });

  it('404s for an unknown game', async () => {
    await request(app.getHttpServer()).get('/games/not-a-real-game').expect(404);
  });

  it('plays a move and alternates the turn', async () => {
    const id = await createGame();

    const response = await request(app.getHttpServer()).post(`/games/${id}/moves`).send({ from: 'e2', to: 'e4' }).expect(200);

    expect(response.body.turn).toBe('b');
    expect(response.body.history).toHaveLength(1);
    expect(response.body.history[0].san).toBe('e4');
  });

  it('lists legal moves for a square', async () => {
    const id = await createGame();

    const response = await request(app.getHttpServer()).get(`/games/${id}/moves`).query({ square: 'e2' }).expect(200);

    expect(response.body.square).toBe('e2');
    expect(response.body.moves.map((move: { to: string }) => move.to).sort()).toEqual(['e3', 'e4']);
  });

  it('lists every legal move when no square is given', async () => {
    const id = await createGame();

    const response = await request(app.getHttpServer()).get(`/games/${id}/moves`).expect(200);

    expect(response.body.moves).toHaveLength(20);
  });

  it('reaches checkmate and reports the winner', async () => {
    const id = await createGame();

    const response = await play(id, FOOLS_MATE);

    expect(response.body).toMatchObject({ status: 'checkmate', result: '0-1', inCheck: true });
  });

  it('409s on a move after the game is over', async () => {
    const id = await createGame();
    await play(id, FOOLS_MATE);

    await request(app.getHttpServer()).post(`/games/${id}/moves`).send({ from: 'e2', to: 'e4' }).expect(409);
  });

  it('400s on an illegal but well-formed move', async () => {
    const id = await createGame();

    await request(app.getHttpServer()).post(`/games/${id}/moves`).send({ from: 'e2', to: 'e5' }).expect(400);
  });

  it('400s on a square that does not exist', async () => {
    const id = await createGame();

    await request(app.getHttpServer()).post(`/games/${id}/moves`).send({ from: 'z9', to: 'e4' }).expect(400);
  });

  it('400s on an unknown property', async () => {
    const id = await createGame();

    await request(app.getHttpServer()).post(`/games/${id}/moves`).send({ from: 'e2', to: 'e4', color: 'w' }).expect(400);
  });

  it('400s on a bad legal-moves query', async () => {
    const id = await createGame();

    await request(app.getHttpServer()).get(`/games/${id}/moves`).query({ square: 'zz' }).expect(400);
  });

  it('resigns and blocks further play', async () => {
    const id = await createGame();

    const response = await request(app.getHttpServer()).post(`/games/${id}/resign`).send({ color: 'w' }).expect(200);
    expect(response.body).toMatchObject({ status: 'resigned', result: '0-1' });

    await request(app.getHttpServer()).post(`/games/${id}/moves`).send({ from: 'e2', to: 'e4' }).expect(409);
    expect((await request(app.getHttpServer()).get(`/games/${id}`).expect(200)).body.status).toBe('resigned');
  });

  it('400s on an invalid resigning colour', async () => {
    const id = await createGame();

    await request(app.getHttpServer()).post(`/games/${id}/resign`).send({ color: 'green' }).expect(400);
  });

  it('agrees a draw', async () => {
    const id = await createGame();

    const response = await request(app.getHttpServer()).post(`/games/${id}/draw`).expect(200);

    expect(response.body).toMatchObject({ status: 'draw', result: '1/2-1/2', drawReason: 'agreement' });
  });
});

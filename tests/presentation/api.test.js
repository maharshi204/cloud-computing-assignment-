const request = require('supertest');

// We override DATA_SOURCE for this test file context before requiring config/app.
process.env.DATA_SOURCE = 'memory';

const { buildApp } = require('../../app');

describe('API Endpoints (Memory Repository)', () => {
  let app;
  
  beforeAll(() => {
    app = buildApp(null);
  });

  const validBook = {
    title: 'Test API',
    author: 'Tester',
    isbn: '1000000000',
    publicationYear: 2021,
    quantity: 1
  };

  it('POST /api/books returns 201 on create', async () => {
    const res = await request(app)
      .post('/api/books')
      .send(validBook);
    
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.header.location).toBe(`/api/books/${res.body.data.id}`);
  });

  it('POST /api/books returns 400 with details on bad ISBN', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ ...validBook, isbn: '123' });
    
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'isbn' })
      ])
    );
  });

  it('GET /api/books/:id returns 404 on missing id', async () => {
    const res = await request(app).get('/api/books/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/books/:id/checkout returns 422 on checking out a 0-quantity book', async () => {
    // Create a 0-qty book
    const createRes = await request(app)
      .post('/api/books')
      .send({ ...validBook, isbn: '2000000000', quantity: 0 });
    
    const id = createRes.body.data.id;

    // Checkout
    const checkoutRes = await request(app)
      .post(`/api/books/${id}/checkout`);
      
    expect(checkoutRes.status).toBe(422);
    expect(checkoutRes.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('POST /api/books returns 409 on duplicate ISBN', async () => {
    await request(app)
      .post('/api/books')
      .send({ ...validBook, isbn: '3000000000' });
      
    const res = await request(app)
      .post('/api/books')
      .send({ ...validBook, isbn: '3000000000' });
      
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

function ok(res, data) {
  res.status(200).json({ data });
}

function created(res, data) {
  res.status(201).json({ data });
}

function noContent(res) {
  res.status(204).end();
}

module.exports = {
  ok,
  created,
  noContent
};

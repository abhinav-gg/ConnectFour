import type { NextApiRequest, NextApiResponse } from 'next';

type EchoResponse = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EchoResponse>
) {
  const name = req.query.name?.toString() || 'World';

  if (name.toLowerCase().includes("toast")) {
    res.status(400).json({ message: "No toast allowed!" });
    return;
  }

  res.status(200).json({ message: `Hello, ${name}!` });
}
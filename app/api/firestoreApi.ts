import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/firebase/server";
import { collection, getDocs } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const leaderboardRef = collection(db, "leaderboard");
    const querySnapshot = await getDocs(leaderboardRef);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

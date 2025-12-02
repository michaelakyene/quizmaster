import { getOverview } from "./analytics.service.js";

export async function getAnalytics(req, res, next) {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 30;
    const data = await getOverview({ days });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

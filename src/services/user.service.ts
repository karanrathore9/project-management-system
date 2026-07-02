import User from '../models/User';

const RESULT_LIMIT = 10;

export async function searchUsers(query: string, excludeUserId: string) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped, 'i');

  const users = await User.find({
    _id: { $ne: excludeUserId },
    $or: [{ name: pattern }, { email: pattern }],
  })
    .select('name email')
    .limit(RESULT_LIMIT);

  return users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email }));
}
export async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });
    console.log("RESPONSE COMPLÈTE DU BACKEND:", response.data);
onLoginSuccess(response.data);
    
    const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET_KEY);
    
    req.user = payload;
    req.userId = payload.userId;  // ✅ cohérent avec server.js
    req.userRole = payload.role;  // ✅ role disponible
    
    next();
  } catch (err) {
    console.error("AuthMiddleware error:", err);
    res.status(401).json({ error: "Non autorisé" });
  }
}
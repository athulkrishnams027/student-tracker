export const getAuth = () => {
  try {
    const data = localStorage.getItem("authUser") || localStorage.getItem("loggedInStudent");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setAuth = (userData) => {
  localStorage.setItem("authUser", JSON.stringify(userData));
  // Keep loggedInStudent in sync for backwards-compatibility
  if (userData.role === "STUDENT") {
    localStorage.setItem("loggedInStudent", JSON.stringify(userData));
  } else {
    localStorage.removeItem("loggedInStudent");
  }
  window.dispatchEvent(new Event("authChange"));
};

export const clearAuth = () => {
  localStorage.removeItem("authUser");
  localStorage.removeItem("loggedInStudent");
  window.dispatchEvent(new Event("authChange"));
};

export const isAdmin = () => {
  const auth = getAuth();
  return auth && auth.role === "ADMIN";
};

export const isStudent = () => {
  const auth = getAuth();
  return auth && auth.role === "STUDENT";
};

export const getAuthHeaders = () => {
  const auth = getAuth();
  if (!auth) return { headers: {} };
  return {
    headers: {
      "X-User-Role": auth.role || "",
      "X-User-Id": auth.id ? String(auth.id) : "",
    },
  };
};


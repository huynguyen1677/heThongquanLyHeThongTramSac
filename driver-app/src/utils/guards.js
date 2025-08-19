import { auth } from '../services/firebase';

export const authGuards = {
  // Kiểm tra user đã đăng nhập
  requireAuth() {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not authenticated'));
        }
      });
    });
  },

  // Hook để sử dụng trong component
  useAuthGuard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
        setLoading(false);
      });

      return unsubscribe;
    }, []);

    return { user, loading, isAuthenticated: !!user };
  }
};

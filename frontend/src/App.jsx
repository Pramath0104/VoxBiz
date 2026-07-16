import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

// Lazy loaded components
const Signin = lazy(() => import("./components/Signin"));
const Signup = lazy(() => import("./components/Signup"));
const GraphRender = lazy(() => import("./components/GraphRender"));
const ThreeDMarqueeBg = lazy(() => import("./pages/HomePage").then(module => ({ default: module.ThreeDMarqueeBg })));

const MainPage = lazy(() => import("./pages/MainPage").then(module => ({ default: module.MainPage })));
const DatabaseDashboard = lazy(() => import("./pages/DBSelection"));
const DatabaseDetailsPage = lazy(() => import("./pages/DBDetail"));
const DataTable = lazy(() => import("./pages/Table"));

const ForgotPassword = lazy(() => import("./components/ForgotPwd"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const DemoPage = lazy(() => import("./pages/DemoPage").then(module => ({ default: module.DemoPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

import Threads from "./components/Threads";
import { useTheme } from "./contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import Loader from "./components/ui/Loader";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/main" replace />;
  }
  return children;
};

// Wrapper for page transition animations
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

import MainLayout from "./components/MainLayout";

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicRoute><PageWrapper><ThreeDMarqueeBg /></PageWrapper></PublicRoute>} />
        <Route path="/about" element={<PageWrapper><MainLayout><AboutPage /></MainLayout></PageWrapper>} />

        <Route path="/login" element={<PublicRoute><PageWrapper><Signin /></PageWrapper></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><PageWrapper><Signup /></PageWrapper></PublicRoute>} />
        <Route path="/demo" element={<PageWrapper><MainLayout><DemoPage /></MainLayout></PageWrapper>} />
        
        {/* Protected Routes */}
        <Route path="/main" element={<ProtectedRoute><PageWrapper><MainLayout><MainPage /></MainLayout></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><MainLayout><ProfilePage /></MainLayout></PageWrapper></ProtectedRoute>} />
        <Route path="/table" element={<ProtectedRoute><PageWrapper><MainLayout><DataTable /></MainLayout></PageWrapper></ProtectedRoute>} />

        <Route path="/rendergraph" element={<ProtectedRoute><PageWrapper><MainLayout><GraphRender /></MainLayout></PageWrapper></ProtectedRoute>} />
        <Route path="/dblist" element={<ProtectedRoute><PageWrapper><MainLayout><DatabaseDashboard /></MainLayout></PageWrapper></ProtectedRoute>} />
        <Route path="/database/:id" element={<ProtectedRoute><PageWrapper><MainLayout><DatabaseDetailsPage /></MainLayout></PageWrapper></ProtectedRoute>} />



        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};


import { ErrorBoundary } from "./components/ErrorBoundary";

const App = () => {
  const { isDarkMode } = useTheme();

  return (
    <Router>
      {/* Global Background Effect */}
      <div className="fixed inset-0 w-full h-full -z-10 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
          color={isDarkMode ? [1, 1, 1] : [0.1, 0.1, 0.1]}
        />
      </div>

      <Toaster position="top-center" />
      <ErrorBoundary>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader /></div>}>
          <AnimatedRoutes />
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
};

export default App;

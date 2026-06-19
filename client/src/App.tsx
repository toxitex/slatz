import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { SiteConfigProvider } from "./contexts/SiteConfigContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Store from "./pages/Store";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import TopUp from "./pages/TopUp";
import Orders from "./pages/Orders";
import History from "./pages/History";
import Profile from "./pages/Profile";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Keep routing simple and source-editable while preserving the original SyncX dark neon storefront flow.
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/store" component={Store} />
      <Route path="/category/:name" component={Category} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={Admin} />
      <Route path="/topup" component={TopUp} />
      <Route path="/orders" component={Orders} />
      <Route path="/history" component={History} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SiteConfigProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </SiteConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

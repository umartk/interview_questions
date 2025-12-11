import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import theme from './styles/theme';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import styled from 'styled-components';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: ${props => props.theme.colors.background};
`;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <AppContainer>
                <Sidebar />
                <MainContent>
                  <Header />
                  <ContentArea>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route 
                        path="/products" 
                        element={
                          <ProtectedRoute>
                            <ProductList />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/users" 
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <UserManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/analytics" 
                        element={
                          <ProtectedRoute>
                            <Analytics />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </ContentArea>
                </MainContent>
              </AppContainer>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
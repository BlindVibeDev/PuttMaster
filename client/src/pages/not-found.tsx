import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Log the navigation to a 404 page for debugging purposes
  useEffect(() => {
    console.error(`User navigated to non-existent page: ${location.pathname}`);
  }, [location.pathname]);
  
  return (
    <>
      <Helmet>
        <title>Page Not Found | Putt-Putt Multiplayer</title>
      </Helmet>
      
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-4">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h1 className="text-3xl font-bold text-primary">404 Page Not Found</h1>
              <p className="mt-2 text-muted-foreground">
                The page you're looking for doesn't exist.
              </p>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h2 className="font-medium mb-2">You might be looking for:</h2>
              <ul className="space-y-1 text-sm">
                <li>• The main lobby - where you can see available games</li>
                <li>• The game creation page - to start a new game</li>
                <li>• Your active game - if you were in the middle of a match</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2 justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

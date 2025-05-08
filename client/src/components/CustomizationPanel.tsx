import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCustomization, ballTypes, clubTypes, courseStyles } from '@/lib/stores/useCustomization';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function CustomizationPanel() {
  const [activeTab, setActiveTab] = useState('balls');
  const { 
    ballType, 
    clubType, 
    preferredCourseStyle,
    unlockedBalls,
    unlockedClubs,
    unlockedCourses,
    setBallType,
    setClubType,
    setPreferredCourseStyle,
    unlockItem
  } = useCustomization();
  
  // Handle unlocking a new item
  const handleUnlock = (type: 'ball' | 'club' | 'course', id: number) => {
    // In a real app, this would check if the player has enough points/coins
    // and would call the server to confirm the unlock.
    // For this demo, we'll just unlock everything
    
    unlockItem(type, id);
    toast.success(`Unlocked new ${type}!`);
  };
  
  return (
    <div className="customization-panel p-4">
      <Tabs defaultValue="balls" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="balls" className="flex-1">Golf Balls</TabsTrigger>
          <TabsTrigger value="clubs" className="flex-1">Golf Clubs</TabsTrigger>
          <TabsTrigger value="courses" className="flex-1">Course Styles</TabsTrigger>
        </TabsList>
        
        {/* Ball customization */}
        <TabsContent value="balls" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ballTypes.map((ball) => {
              const isUnlocked = unlockedBalls.includes(ball.id);
              const isSelected = ballType === ball.id;
              
              return (
                <Card 
                  key={`ball-${ball.id}`} 
                  className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => isUnlocked && setBallType(ball.id)}
                >
                  <CardContent className="p-4 text-center relative">
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <Lock className="text-white h-8 w-8" />
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <motion.div 
                        className="w-16 h-16 rounded-full mx-auto" 
                        style={{ backgroundColor: ball.color }}
                        animate={{ 
                          scale: isSelected ? [1, 1.05, 1] : 1 
                        }}
                        transition={{ 
                          duration: 0.5, 
                          repeat: isSelected ? Infinity : 0,
                          repeatType: "reverse"
                        }}
                      />
                    </div>
                    
                    <h3 className="font-medium text-sm">{ball.name}</h3>
                    
                    {isSelected && (
                      <Badge className="mt-2 bg-primary mx-auto">Selected</Badge>
                    )}
                    
                    {!isUnlocked && (
                      <Button 
                        size="sm" 
                        className="mt-2 text-xs" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock('ball', ball.id);
                        }}
                      >
                        Unlock
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Club customization */}
        <TabsContent value="clubs" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubTypes.map((club) => {
              const isUnlocked = unlockedClubs.includes(club.id);
              const isSelected = clubType === club.id;
              
              return (
                <Card 
                  key={`club-${club.id}`} 
                  className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => isUnlocked && setClubType(club.id)}
                >
                  <CardContent className="p-4 flex justify-between items-center relative">
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <Lock className="text-white h-8 w-8" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium">{club.name}</h3>
                      <p className="text-sm text-muted-foreground">Power: {club.power.toFixed(1)}x</p>
                      
                      {isSelected && (
                        <Badge className="mt-2 bg-primary">Selected</Badge>
                      )}
                    </div>
                    
                    <motion.div 
                      className="h-16 w-4 bg-gray-800 rounded-sm transform"
                      style={{ 
                        transformOrigin: 'bottom center'
                      }}
                      animate={{ 
                        rotateZ: isSelected ? [0, -20, 0] : 0 
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: isSelected ? Infinity : 0,
                        repeatType: "reverse",
                        repeatDelay: 1
                      }}
                    />
                    
                    {!isUnlocked && (
                      <Button 
                        size="sm" 
                        className="absolute bottom-4 right-4" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock('club', club.id);
                        }}
                      >
                        Unlock
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Course customization */}
        <TabsContent value="courses" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseStyles.map((course) => {
              const isUnlocked = unlockedCourses.includes(course.id);
              const isSelected = preferredCourseStyle === course.id;
              
              return (
                <Card 
                  key={`course-${course.id}`} 
                  className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => isUnlocked && setPreferredCourseStyle(course.id)}
                >
                  <CardContent className="p-4 relative">
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <Lock className="text-white h-8 w-8" />
                      </div>
                    )}
                    
                    <div className="h-24 mb-2 rounded-md overflow-hidden relative" 
                      style={{ 
                        backgroundImage: `url('/textures/${getCourseTexture(course.id)}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: getCourseColor(course.id), opacity: 0.5 }}
                      />
                    </div>
                    
                    <h3 className="font-medium">{course.name}</h3>
                    
                    {isSelected && (
                      <Badge className="mt-2 bg-primary">Selected</Badge>
                    )}
                    
                    {!isUnlocked && (
                      <Button 
                        size="sm" 
                        className="mt-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock('course', course.id);
                        }}
                      >
                        Unlock
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions to get texture and color for course preview
function getCourseTexture(courseId: number): string {
  switch (courseId) {
    case 0: return 'grass.png';
    case 1: return 'sand.jpg';
    case 2: return 'asphalt.png';
    case 3: return 'wood.jpg';
    case 4: return 'grass.png'; // Darker variant 
    case 5: return 'grass.png'; // Lighter variant
    default: return 'grass.png';
  }
}

function getCourseColor(courseId: number): string {
  switch (courseId) {
    case 0: return '#88cc88'; // Classic green
    case 1: return '#e6d59e'; // Sandy color
    case 2: return '#999999'; // Urban gray
    case 3: return '#cc9966'; // Wood brown
    case 4: return '#77aa77'; // Darker green
    case 5: return '#99dd99'; // Lighter green
    default: return '#88cc88';
  }
}

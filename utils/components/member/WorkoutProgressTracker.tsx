import React from 'react';
import PersonalizedWorkoutSuite from './PersonalizedWorkoutSuite';

const WorkoutProgressTracker: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  return <PersonalizedWorkoutSuite defaultTab="progress" currentUser={currentUser} />;
};

export default WorkoutProgressTracker;

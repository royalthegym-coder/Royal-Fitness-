import React from 'react';
import PersonalizedWorkoutSuite from './PersonalizedWorkoutSuite';

const WorkoutPlanGenerator: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  return <PersonalizedWorkoutSuite defaultTab="planner" currentUser={currentUser} />;
};

export default WorkoutPlanGenerator;

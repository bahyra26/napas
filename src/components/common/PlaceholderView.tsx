import React from 'react';

interface PlaceholderViewProps {
  icon: string;
  title: string;
  description: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="placeholder-view-card">
      <div className="pv-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

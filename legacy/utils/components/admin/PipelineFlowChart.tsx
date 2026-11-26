import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const PipelineFlowChart: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const width = 600;
        const height = 150;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const innerWidth = width - margin.left - margin.right;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        svg.attr('viewBox', `0 0 ${width} ${height}`)
           .attr('preserveAspectRatio', 'xMidYMid meet')
           .style('width', '100%')
           .style('height', '100%');

        const g = svg.append('g')
                     .attr('transform', `translate(${margin.left},${margin.top})`);

        const pipelineSteps = [
            { id: 1, name: 'Checkout', duration: 15, bottleneck: false },
            { id: 2, name: 'Install Deps', duration: 45, bottleneck: false },
            { id: 3, name: 'Lint & Type Check', duration: 30, bottleneck: false },
            { id: 4, name: 'Build/Compile', duration: 180, bottleneck: true }, // Bottleneck
            { id: 5, name: 'Unit Tests', duration: 40, bottleneck: false },
            { id: 6, name: 'Deploy', duration: 25, bottleneck: false }
        ];

        // Scale
        const totalDuration = pipelineSteps.reduce((acc, step) => acc + step.duration, 0);
        const xScale = d3.scaleLinear()
                         .domain([0, totalDuration])
                         .range([0, innerWidth]);

        // Draw connections
        g.append('line')
         .attr('x1', 0)
         .attr('y1', 50)
         .attr('x2', innerWidth)
         .attr('y2', 50)
         .attr('stroke', 'rgba(255,255,255,0.1)')
         .attr('stroke-width', 4)
         .attr('stroke-linecap', 'round');

        let currentX = 0;
        
        // Draw segments
        pipelineSteps.forEach((step, i) => {
            const stepWidth = xScale(step.duration);
            const segmentX = currentX;
            currentX += stepWidth;

            // Highlight bar
            const stepGroup = g.append('g')
                .attr('transform', `translate(${segmentX}, 0)`);

            // Duration bar
            stepGroup.append('rect')
                .attr('x', 2)
                .attr('y', 46)
                .attr('width', Math.max(0, stepWidth - 4))
                .attr('height', 8)
                .attr('rx', 4)
                .attr('fill', step.bottleneck ? '#f59e0b' : '#3b82f6')
                .attr('opacity', 0.8)
                .style('transition', 'fill 0.3s ease')
                // Simple hover effect
                .on('mouseover', function() { d3.select(this).attr('fill', step.bottleneck ? '#fbbf24' : '#60a5fa'); })
                .on('mouseout', function() { d3.select(this).attr('fill', step.bottleneck ? '#f59e0b' : '#3b82f6'); });

            // Circle node
            stepGroup.append('circle')
                .attr('cx', stepWidth / 2)
                .attr('cy', 50)
                .attr('r', step.bottleneck ? 8 : 6)
                .attr('fill', step.bottleneck ? '#f39c12' : '#2563eb')
                .attr('stroke', '#000')
                .attr('stroke-width', 2);

            // Pulse effect for bottleneck
            if (step.bottleneck) {
                const pulse = stepGroup.append('circle')
                    .attr('cx', stepWidth / 2)
                    .attr('cy', 50)
                    .attr('r', 8)
                    .attr('fill', 'none')
                    .attr('stroke', '#f39c12')
                    .attr('stroke-width', 2)
                    .attr('opacity', 1);

                function repeatPulse() {
                    pulse.attr('r', 8)
                        .attr('opacity', 1)
                        .transition()
                        .duration(1500)
                        .attr('r', 20)
                        .attr('opacity', 0)
                        .on('end', repeatPulse);
                }
                repeatPulse();
            }

            // Label
            stepGroup.append('text')
                .attr('x', stepWidth / 2)
                .attr('y', 25)
                .attr('text-anchor', 'middle')
                .attr('fill', step.bottleneck ? '#f39c12' : '#9ca3af')
                .attr('font-size', '10px')
                .attr('font-weight', step.bottleneck ? 'bold' : 'normal')
                .text(step.name);

            // Duration text
            stepGroup.append('text')
                .attr('x', stepWidth / 2)
                .attr('y', 75)
                .attr('text-anchor', 'middle')
                .attr('fill', '#6b7280')
                .attr('font-size', '9px')
                .text(`${step.duration}s`);
        });

    }, []);

    return (
        <div className="w-full h-32 overflow-hidden">
            <svg ref={svgRef}></svg>
        </div>
    );
};

import React from 'react';

interface SafeTextProps {
    text: string;
    boldClassName?: string;
}

/** Render model/user text as React text nodes; only a tiny bold convention is supported. */
const SafeText: React.FC<SafeTextProps> = ({ text, boldClassName }) => (
    <>
        {text.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
                {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
                    const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
                    return isBold
                        ? <strong className={boldClassName} key={partIndex}>{part.slice(2, -2)}</strong>
                        : <React.Fragment key={partIndex}>{part}</React.Fragment>;
                })}
                {lineIndex < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ))}
    </>
);

export default SafeText;

import React, { Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './Scene'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("WebGL Canvas Error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#e8a042',
                    background: 'rgba(232, 160, 66, 0.05)',
                    border: '1px dashed rgba(232, 160, 66, 0.3)',
                    borderRadius: '8px'
                }}>
                    <span style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</span>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>WebGL Graphic Context Crashed</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8aab90', maxWidth: '360px', lineHeight: 1.5 }}>
                        The 3D digital twin requires WebGL support. This can happen if GPU acceleration is disabled, or due to headless browser rendering constraints.
                    </p>
                </div>
            )
        }

        return this.props.children
    }
}

export default function SmartFarm3D() {
    return (
        <div
            id="agrisense-3d-canvas-container"
            style={{
                position: 'relative',
                width: '100%',
                height: '480px',
                background: '#0c1e13',
                borderRadius: '12px',
                border: '1px solid rgba(76, 175, 125, 0.15)',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
            }}
        >
            <WebGLErrorBoundary>
                <Canvas
                    shadows
                    camera={{ position: [10, 8, 12], fov: 40 }}
                >
                    <Scene />
                </Canvas>
            </WebGLErrorBoundary>
        </div>
    )
}

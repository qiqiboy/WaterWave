import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { requestAnimationFrame, cancelAnimationFrame } from 'raf-dom';
import * as events from './events';

class Water extends Component {
    componentDidMount() {
        const canvasParent = this.refs.canvas.parentNode;
        const position = window.getComputedStyle(canvasParent, null).position;

        if (position === 'static') {
            canvasParent.style.position = 'relative';
        }

        canvasParent.classList.add('water-wave-target');

        Object.keys(events.event2code)
            .forEach(type => {
                canvasParent.addEventListener(type, this, false);
            });
    }

    componentWillUnmount() {
        const canvasParent = this.refs.canvas.parentNode;

        cancelAnimationFrame(this.timer);
        clearTimeout(this.clearTimer);
        canvasParent.classList.remove('water-wave-container');

        Object.keys(events.event2code)
            .forEach(type => {
                canvasParent.removeEventListener(type, this, false);
            });
    }

    handleEvent(ev) {
        const code = events.getCode(ev.type);
        const group = events.getGroup(ev.type);

        switch (code) {
            case 0:
                if (!this.eventGroup) {
                    this.eventGroup = group;
                }
            case 2:
                //确保前后一致的事件类型
                if (this.eventGroup === group) {
                    const _ev = events.format(ev);
                    const { pageX, pageY } = _ev;

                    clearTimeout(this.clearTimer);

                    if (code === 0 && !this.startState) {
                        this.startState = {
                            pageX,
                            pageY
                        }
                    }

                    if (code === 2 && this.startState) {
                        if (Math.abs(pageX - this.startState.pageX) < 10 &&
                            Math.abs(pageY - this.startState.pageY) < 10) {
                            this.createWave(_ev);
                        }
                    }

                    if (code === 2) {
                        this.clearEvent();
                    }
                }
                break;
            case 3:
                this.clearEvent();
                break;
        }
    }

    clearEvent() {
        delete this.startState;
        this.clearTimer = setTimeout(() => {
            delete this.eventGroup;
        }, 500);
    }

    createWave = ev => {
        const canvasParent = this.refs.canvas.parentNode;
        const disabled = typeof this.props.disabled === 'boolean' ? this.props.disabled : canvasParent.disabled;

        if (!disabled) {
            const dpr = window.devicePixelRatio || 1;
            const { top, left, width, height } = canvasParent.getBoundingClientRect();
            const { clientX, clientY } = ev;
            const pointX = clientX - left;
            const pointY = clientY - top;
            const canvas = this.refs.canvas;
            const ctx = canvas.getContext('2d');
            const { duration, radius, alpha } = this.props;
            const maxRadius = typeof radius === 'number' ? radius : Math.max(width, height);
            const [x, y] = this.getOrigin(width, height);

            canvas.width = width * dpr;
            canvas.height = height * dpr;

            ctx.scale(dpr, dpr);

            const startTime = Date.now();
            const run = () => {
                const now = Date.now();
                const offset = now - startTime;

                cancelAnimationFrame(this.timer);
                ctx.clearRect(0, 0, width, height);

                if (offset < duration) {
                    this.draw(ctx,
                        isNaN(x) ? pointX : x,
                        isNaN(y) ? pointY : y,
                        offset / duration * maxRadius,
                        Math.min(alpha, 1 - offset / duration));

                    this.timer = requestAnimationFrame(run);
                }
            }

            run();
        }
    }

    draw(ctx, x, y, radius, opacity) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.props.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
    }

    getOrigin(width, height) {
        const ret = this.props.origin.split(/\s+/);
        const left = this.getPoint(ret[0], width);
        const top = this.getPoint(ret[1], height);

        return [left, top];
    }

    getPoint(name = 'auto', size) {
        let numOrPer = name;

        if (/^\d+%?$/.test(name) === false) {
            switch (name) {
                case 'top':
                case 'left':
                    numOrPer = '0';
                    break;
                case 'right':
                case 'bottom':
                    numOrPer = '100%';
                    break;
                case 'center':
                    numOrPer = '50%';
                    break;
            }
        }

        return parseFloat(numOrPer) * (numOrPer.substr(-1) === '%' ? size / 100 : 1);
    }

    render() {
        return (
            <canvas ref="canvas" className="water-wave-canvas"></canvas>
        );
    }

    static defaultProps = {
        duration: 500,
        color: '#fff',
        origin: 'auto',
        radius: 'auto',
        alpha: .3
    }

    static propTypes = {
        duration: PropTypes.number.isRequired,
        color: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        origin: PropTypes.string.isRequired,
        radius: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]).isRequired,
        alpha: PropTypes.number.isRequired
    }
}

export default Water;

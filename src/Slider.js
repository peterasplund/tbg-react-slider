import React from 'react';
import ReactDOM from 'react-dom';
import style from './Style';
import { Fade } from './Transitions';

// This line ensures compatibility back to react 0.13
const findDOMNode = ReactDOM.findDOMNode || React.findDOMNode;

let delayInterval = null;
let transitionTimeout = null;

export default class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeItem: this.props.initialSlide,
      lastItem: this.props.initialSlide,
      active: true,
      viewport: {
        active: {},
        last: {},
      },
    };
    const Transition = this.props.transition;
    this.transition = new Transition;
  }

  componentDidMount() {
    this.props.onShow(this.state.activeItem);

    if (this.props.autoplay) {
      this.start();
    }
  }

  getViewportDimensions() {
    return {
      active: findDOMNode(this.refs.viewport_active).getBoundingClientRect(),
      last: findDOMNode(this.refs.viewport_last).getBoundingClientRect(),
    };
  }

  getDotActiveClass(i) {
    return i === this.state.activeItem ? 'is-active' : '';
  }

  getActiveStyle() {
    if (!this.state.active) {
      return Object.assign(
        this.transition.end(this.state.direction, this.state.viewport.active),
        this.transition.transition(this.props.transitionTime)
      );
    }
    return this.transition.start(this.state.direction, this.state.viewport.active);
  }

  getLastStyle() {
    if (!this.state.active) {
      return Object.assign(
        this.transition.prevEnd(this.state.direction, this.state.viewport.last),
        this.transition.transition(this.props.transitionTime),
        style.lastView
      );
    }
    return Object.assign(
      this.transition.prevStart(this.state.direction, this.state.viewport.last),
      style.lastView
    );
  }

  getNextItem(dir) {
    const direction = dir === 'left' ? -1 : 1;
    this.setState({ direction });
    return this.state.activeItem + direction;
  }

  setActive(active) {
    clearTimeout(transitionTimeout);
    this.setState({ active });
  }


  start() {
    this.stop();
    delayInterval = setInterval(
      this.incrementActiveItem.bind(this),
      this.props.delay
    );
  }

  stop() {
    clearInterval(delayInterval);
  }

  next() {
    this.handleArrowClick('right');
  }

  prev() {
    this.handleArrowClick('left');
  }

  goto(index) {
    this.stop();
    this.findItemDirection(index);
    this.gotoSlide(index);
    if (this.props.autoplay) { this.start(); }
  }

  findItemDirection(index) {
    const direction = index < this.state.activeItem ? -1 : 1;
    this.setState({ direction });
  }

  endTransition() {
    transitionTimeout = setTimeout(this.setActive.bind(this, false), 30);
    this.props.onChange();
    this.props.onShow(this.state.activeItem);
  }

  incrementActiveItem(dir = this.props.direction) {
    let activeItem = this.getNextItem(dir);
    if (activeItem > this.props.children.length - 1) {
      activeItem = 0;
    }
    if (activeItem < 0) {
      activeItem = this.props.children.length - 1;
    }
    this.gotoSlide(activeItem);
  }

  gotoSlide(activeItem) {
    const viewport = this.getViewportDimensions();

    this.setActive(true);
    this.setState({
      lastItem: this.state.activeItem,
      activeItem,
      viewport,
    }, this.endTransition.bind(this));
  }

  handleArrowClick(direction) {
    this.stop();
    this.incrementActiveItem(direction);
    if (this.props.autoplay) { this.start(); }
  }


  renderDot(child, i) {
    return (
      <span
        onClick={ this.goto.bind(this, i) }
        key={`dot_${i}`}
        className={`${this.props.className}__dot ${this.getDotActiveClass(i)}`}
      > { this.props.dot } </span>
    );
  }

  renderDots() {
    if (!this.props.dots) { return null; }
    return (
      this.props.children.map(this.renderDot.bind(this))
    );
  }

  renderNavArrow(dir) {
    if (!this.props.arrows) { return null; }
    return (
      <div
        onClick={ this.handleArrowClick.bind(this, dir) }
        style={ style[`nav__${dir}`] }
        className={`${this.props.className}__arrow ${this.props.className}__arrow--${dir}`}
      >
        { this.props.arrow[dir] }
      </div>
    );
  }
  renderLastView() {
    return (
      <section
        ref="viewport_last"
        style={ this.getLastStyle() }
        className={`${this.props.className}__view`}
      >
        { this.props.children[this.state.lastItem] }
      </section>
    );
  }

  renderActiveView() {
    return (
      <section
        ref="viewport_active"
        style={ this.getActiveStyle() }
        className={`${this.props.className}__view`}
      >
        { this.props.children[this.state.activeItem] }
      </section>
    );
  }

  render() {
    return (
      <div className={ this.props.className } style={ style.slider }>
        <section className={`${this.props.className}__wrapper`} style={style.wrapper}>
          { this.renderActiveView() }
          { this.renderLastView() }
        </section>
        { this.renderNavArrow('left') }
        { this.renderNavArrow('right') }
        <section className={`${this.props.className}__dots`} style={ style.dots }>
          { this.renderDots() }
        </section>
      </div>
    );
  }
}


Slider.propTypes = {
  arrows: React.PropTypes.bool,
  autoplay: React.PropTypes.bool,
  children: React.PropTypes.any.isRequired,
  className: React.PropTypes.string,
  delay: React.PropTypes.number,
  direction: React.PropTypes.string,
  dots: React.PropTypes.bool,
  initialSlide: React.PropTypes.number,
  transition: React.PropTypes.any,
  transitionTime: React.PropTypes.number,

  onChange: React.PropTypes.func,
  onShow: React.PropTypes.func,

  dot: React.PropTypes.element,
  arrow: React.PropTypes.object,
};

Slider.defaultProps = {
  arrows: true,
  autoplay: true,
  className: 'slider',
  delay: 5000,
  direction: 'right',
  dots: false,
  initialSlide: 0,
  transition: Fade,
  transitionTime: 0.5,

  onChange: () => { },
  onShow: () => { },

  dot: <span>&#8226;</span>,
  arrow: {
    left: <span>&#8249;</span>,
    right: <span>&#8250;</span>,
  },
};

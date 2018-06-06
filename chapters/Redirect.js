import React from "react";
import PropTypes from "prop-types";
import warning from "warning";
import invariant from "invariant";
import { createLocation, locationsAreEqual } from "history";
import generatePath from "./generatePath";

/**
 * The public API for updating the location programmatically
 * with a component.
 */
class Redirect extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  };

  static defaultProps = {
    push: false
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired,
      staticContext: PropTypes.object
    }).isRequired
  };

  isStatic() {
    // 如果是 staticRouter 才会有staticContext！！！
    return this.context.router && this.context.router.staticContext;
  }

  componentWillMount() {
    invariant(
      this.context.router,
      "You should not use <Redirect> outside a <Router>"
    );

    if (this.isStatic()) this.perform();
  }

  componentDidMount() {
    if (!this.isStatic()) this.perform();
  }

  componentDidUpdate(prevProps) {
    // 重定向前的地址和重定向后的地址一样 还需要跳转吗？ 给一个警告
    const prevTo = createLocation(prevProps.to);
    const nextTo = createLocation(this.props.to);

    if (locationsAreEqual(prevTo, nextTo)) {
      warning(
        false,
        `You tried to redirect to the same route you're currently on: ` +
          `"${nextTo.pathname}${nextTo.search}"`
      );
      return;
    }
    // 跳转
    this.perform();
  }

  computeTo({ computedMatch, to }) {
    if (computedMatch) {
      if (typeof to === "string") {
        // 返回路径
        return generatePath(to, computedMatch.params);
      } else {
        return {
          ...to,
          pathname: generatePath(to.pathname, computedMatch.params)
        };
      }
    }

    return to;
  }

  perform() {
    const { history } = this.context.router;
    const { push } = this.props;
    const to = this.computeTo(this.props);
    // 跳转， 是否是 替换历史值？
    if (push) {
      history.push(to);
    } else {
      history.replace(to);
    }
  }

  render() {
    return null;
  }
}

export default Redirect;

// Redirect 无返回值 // 判断要去的路径和当前路径是否一致，一致的话不跳， over

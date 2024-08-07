const defaultOptionName = 'default';

class AppEnv {
  get current() {
    return this.env;
  }

  constructor(env) {
    this.env = env;

    if (!this.env) {
      throw new Error('Got empty current environment name! Please make sure to pass it explicitly in the constructor');
    }
  }

  select(options) {
    const envKeys = Object.keys(options);
    const shouldUseDefault = !envKeys.includes(this.current);

    if (shouldUseDefault && !envKeys.includes(defaultOptionName)) {
      throw new Error(`Missing value for environment '${this.current}' and '${defaultOptionName}' option was not set.`);
    }

    return shouldUseDefault ? options[defaultOptionName] : options[this.current];
  }
}

module.exports = { AppEnv };

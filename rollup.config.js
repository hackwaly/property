import babel from 'rollup-plugin-babel';
import es2015 from 'babel-preset-es2015-rollup';
import classes from 'babel-plugin-transform-es2015-classes';

export default {
	plugins: [
		babel({
			presets: [{
				plugins: es2015.plugins.map((plugin) => {
					if (plugin === classes) {
						return [plugin, {
							loose: true
						}];
					}
					return plugin;
				})
			}, 'stage-1']
		})
	]
};

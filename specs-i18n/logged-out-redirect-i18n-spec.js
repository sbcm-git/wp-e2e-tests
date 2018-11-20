/**
 * External Dependencies
 *
 * @format
 */

import config from 'config';

/**
 * Internal Dependencies
 */
import * as driverManager from '../lib/driver-manager.js';

import WPHomePage from '../lib/pages/wp-home-page';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );

// call run.sh with -I to feed in the mag16
const locale = driverManager.currentLocale();

let driver;

beforeAll( function() {
	jest.setTimeout( startBrowserTimeoutMS );
} );

describe( `Logged out homepage redirect test @i18n (${ locale })`, () => {
	jest.setTimeout( mochaTimeOut );

	it(
		`should redirect to the correct url for wordpress.com (${ locale })`,
		async () => {
			driver = await driverManager.startBrowser();

			// No culture here implies 'en'
			const wpHomePage = await WPHomePage.Visit( driver );
			await wpHomePage.checkURL( locale );
		}
	);
} );

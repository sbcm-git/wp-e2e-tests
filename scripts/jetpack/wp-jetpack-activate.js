/** @format */

import test from 'selenium-webdriver/testing';
import config from 'config';

import * as driverManager from '../../lib/driver-manager';
import * as dataHelper from '../../lib/data-helper';

import LoginFlow from '../../lib/flows/login-flow';

import PickAPlanPage from '../../lib/pages/signup/pick-a-plan-page';
import WPAdminJetpackPage from '../../lib/pages/wp-admin/wp-admin-jetpack-page';

import WPAdminSidebar from '../../lib/pages/wp-admin/wp-admin-sidebar';
import WPAdminPluginsPage from '../../lib/pages/wp-admin/wp-admin-plugins-page';
import JetpackAuthorizePage from '../../lib/pages/jetpack-authorize-page';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

var driver;

test.before( function() {
	this.timeout( startBrowserTimeoutMS );
	driver = driverManager.startBrowser();
} );

test.describe( `[${ host }] Jetpack Connection: (${ screenSize }) @jetpack`, function() {
	this.timeout( mochaTimeOut );

	test.describe( 'Activate Jetpack Plugin:', function() {
		this.bailSuite( true );

		test.before( async function() {
			return await driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		test.it( 'Can log into WordPress.com', async function() {
			this.loginFlow = new LoginFlow( driver, 'jetpackUserCI' );
			return await this.loginFlow.login();
		} );

		test.it( 'Can log into site via wp-login.php', async function() {
			return await this.loginFlow.login( { jetpackDIRECT: true } );
		} );

		test.it( 'Can open Plugins page', async function() {
			await WPAdminSidebar.refreshIfJNError( driver );
			this.wpAdminSidebar = await WPAdminSidebar.Expect( driver );
			return await this.wpAdminSidebar.selectPlugins();
		} );

		test.it( 'Can activate Jetpack', async function() {
			this.wpAdminPlugins = new WPAdminPluginsPage( driver );
			return await this.wpAdminPlugins.activateJetpack();
		} );

		test.it( 'Can connect Jetpack', async function() {
			this.wpAdminPlugins.connectJetpackAfterActivation();
			this.jetpackAuthorizePage = await JetpackAuthorizePage.Expect( driver );
			await this.jetpackAuthorizePage.approveConnection();
		} );

		test.it( 'Can select Free plan', async function() {
			const pickAPlanPage = await PickAPlanPage.Expect( driver );
			return await pickAPlanPage.selectFreePlan();
		} );

		test.it( 'Can activate recommended features', async function() {
			this.jetpackDashboard = new WPAdminJetpackPage( driver );
			return await this.jetpackDashboard.activateRecommendedFeatures();
		} );
	} );
} );

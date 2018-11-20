/** @format */

import config from 'config';
import assert from 'assert';

import * as driverManager from '../lib/driver-manager.js';

import LoginFlow from '../lib/flows/login-flow.js';

import CustomizerPage from '../lib/pages/customizer-page';
import ThemesPage from '../lib/pages/themes-page.js';
import ThemePreviewPage from '../lib/pages/theme-preview-page.js';
import ThemeDetailPage from '../lib/pages/theme-detail-page.js';
import ThemeDialogComponent from '../lib/components/theme-dialog-component.js';
import SidebarComponent from '../lib/components/sidebar-component';
import WPAdminCustomizerPage from '../lib/pages/wp-admin/wp-admin-customizer-page.js';
import WPAdminLogonPage from '../lib/pages/wp-admin/wp-admin-logon-page.js';
import * as dataHelper from '../lib/data-helper';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Previewing Themes: (${ screenSize })`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	jest.setTimeout( mochaTimeOut );

	describe( 'Previewing Themes @parallel @jetpack', () => {
		it( 'Delete Cookies and Login', async () => {
			let loginFlow = new LoginFlow( driver );
			await loginFlow.loginAndSelectThemes();
		} );

		describe( 'Can preview free themes', () => {
			it( 'Can select a different free theme', async () => {
				testContext.themesPage = await ThemesPage.Expect( driver );
				await testContext.themesPage.waitUntilThemesLoaded();
				await testContext.themesPage.showOnlyFreeThemes();
				await testContext.themesPage.searchFor( 'Twenty S' );
				await testContext.themesPage.waitForThemeStartingWith( 'Twenty S' );
				return await testContext.themesPage.selectNewThemeStartingWith( 'Twenty S' );
			} );

			it( 'Can see theme details page and open the live demo', async () => {
				testContext.themeDetailPage = await ThemeDetailPage.Expect( driver );
				return await testContext.themeDetailPage.openLiveDemo();
			} );

			it( 'Activate button appears on the theme preview page', async () => {
				testContext.themePreviewPage = await ThemePreviewPage.Expect( driver );
				await testContext.themePreviewPage.activateButtonVisible();
			} );
		} );
	} );
} );

describe( `[${ host }] Activating Themes: (${ screenSize }) @parallel @jetpack`, () => {
	jest.setTimeout( mochaTimeOut );
	describe( 'Activating Themes:', () => {
		it( 'Login', async () => {
			let loginFlow = new LoginFlow( driver );
			return await loginFlow.loginAndSelectMySite();
		} );

		it( 'Can open Themes menu', async () => {
			let sidebarComponent = await SidebarComponent.Expect( driver );
			return await sidebarComponent.selectThemes();
		} );

		describe( 'Can switch free themes', () => {
			it( 'Can activate a different free theme', async () => {
				let themesPage = await ThemesPage.Expect( driver );
				await themesPage.waitUntilThemesLoaded();
				await themesPage.showOnlyFreeThemes();
				await themesPage.searchFor( 'Twenty F' );
				await themesPage.waitForThemeStartingWith( 'Twenty F' );
				await themesPage.clickNewThemeMoreButton();
				let displayed = await themesPage.popOverMenuDisplayed();
				assert( displayed, true, 'Popover menu not displayed' );
				return await themesPage.clickPopoverItem( 'Activate' );
			} );

			it( 'Can see the theme thanks dialog', async () => {
				const themeDialogComponent = await ThemeDialogComponent.Expect( driver );
				await themeDialogComponent.customizeSite();
			} );

			if ( host === 'WPCOM' ) {
				it( 'Can customize the site from the theme thanks dialog', async () => {
					return await CustomizerPage.Expect( driver );
				} );
			} else {
				it( 'Can log in via Jetpack SSO', async () => {
					const wpAdminLogonPage = await WPAdminLogonPage.Expect( driver );
					return await wpAdminLogonPage.logonSSO();
				} );

				it( 'Can customize the site from the theme thanks dialog', async () => {
					await WPAdminCustomizerPage.refreshIfJNError( driver );
					return await WPAdminCustomizerPage.Expect( driver );
				} );
			}
		} );
	} );
} );

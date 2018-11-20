/** @format */

import assert from 'assert';

import config from 'config';
import * as driverManager from '../lib/driver-manager.js';
import * as dataHelper from '../lib/data-helper';

import ThemeDetailPage from '../lib/pages/theme-detail-page.js';
import ThemesPage from '../lib/pages/themes-page.js';
import CustomizerPage from '../lib/pages/customizer-page.js';

import SidebarComponent from '../lib/components/sidebar-component';
import SiteSelectorComponent from '../lib/components/site-selector-component';
import ThemeDialogComponent from '../lib/components/theme-dialog-component';
import CurrentThemeComponent from '../lib/components/current-theme-component';

import LoginFlow from '../lib/flows/login-flow.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Themes: All sites (${ screenSize })`, () => {
	let testContext;

	beforeEach( () => {
		testContext = {};
	} );

	describe( 'Preview a theme @parallel', () => {
		testContext.timeout( mochaTimeOut );

		it( 'Login and select themes', async () => {
			testContext.themeSearchName = 'twenty';
			testContext.expectedTheme = 'Twenty F';

			testContext.loginFlow = new LoginFlow( driver, 'multiSiteUser' );
			await testContext.loginFlow.loginAndSelectAllSites();

			testContext.sidebarComponent = await SidebarComponent.Expect( driver );
			await testContext.sidebarComponent.selectThemes();
		} );

		it( 'can search for free themes', async () => {
			testContext.themesPage = await ThemesPage.Expect( driver );
			await testContext.themesPage.waitUntilThemesLoaded();
			await testContext.themesPage.showOnlyFreeThemes();
			await testContext.themesPage.searchFor( testContext.themeSearchName );

			await testContext.themesPage.waitForThemeStartingWith( testContext.expectedTheme );
		} );

		describe( 'when a theme more button is clicked', () => {
			it( 'click theme more button', async () => {
				await testContext.themesPage.clickNewThemeMoreButton();
			} );

			it( 'should show a menu', async () => {
				let displayed = await testContext.themesPage.popOverMenuDisplayed();
				assert( displayed, 'Popover menu not displayed' );
			} );

			describe( 'when "Try & Customize" is clicked', () => {
				it( 'click try and customize popover', async () => {
					await testContext.themesPage.clickPopoverItem( 'Try & Customize' );
					testContext.siteSelector = await SiteSelectorComponent.Expect( driver );
				} );

				it( 'should show the site selector', async () => {
					let siteSelectorShown = await testContext.siteSelector.displayed();
					return assert( siteSelectorShown, 'The site selector was not shown' );
				} );

				describe( 'when a site is selected, and Customize is clicked', () => {
					it( 'select first site', async () => {
						await testContext.siteSelector.selectFirstSite();
						await testContext.siteSelector.ok();
					} );

					it(
						'should open the customizer with the selected site and theme',
						async () => {
							testContext.customizerPage = await CustomizerPage.Expect( driver );
							let url = await driver.getCurrentUrl();
							assert( url.indexOf( testContext.siteSelector.selectedSiteDomain ) > -1, 'Wrong site domain' );
							assert( url.indexOf( testContext.themeSearchName ) > -1, 'Wrong theme' );
						}
					);

					afterAll( async function () {
						await this.customizerPage.close();
					} );
				} );
			} );
		} );
	} );

	describe( 'Activate a theme @parallel', () => {
		testContext.timeout( mochaTimeOut );

		it( 'Login and select themes', async () => {
			testContext.themeSearchName = 'twenty';
			testContext.expectedTheme = 'Twenty F';

			testContext.loginFlow = new LoginFlow( driver, 'multiSiteUser' );
			await testContext.loginFlow.loginAndSelectAllSites();

			testContext.sidebarComponent = await SidebarComponent.Expect( driver );
			await testContext.sidebarComponent.selectThemes();
		} );

		it( 'can search for free themes', async () => {
			testContext.themesPage = await ThemesPage.Expect( driver );
			await testContext.themesPage.waitUntilThemesLoaded();
			await testContext.themesPage.showOnlyFreeThemes();
			await testContext.themesPage.searchFor( testContext.themeSearchName );
			await testContext.themesPage.waitForThemeStartingWith( testContext.expectedTheme );

			testContext.currentThemeName = await testContext.themesPage.getFirstThemeName();
		} );

		describe( 'when a theme more button is clicked', () => {
			it( 'click new theme more button', async () => {
				await testContext.themesPage.clickNewThemeMoreButton();
			} );

			it( 'should show a menu', async () => {
				let displayed = await testContext.themesPage.popOverMenuDisplayed();
				assert( displayed, 'Popover menu not displayed' );
			} );

			describe( 'when Activate is clicked', () => {
				it( 'can click activate', async () => {
					await testContext.themesPage.clickPopoverItem( 'Activate' );
					return testContext.siteSelector = await SiteSelectorComponent.Expect( driver );
				} );

				it( 'shows the site selector', async () => {
					let siteSelectorShown = await testContext.siteSelector.displayed();
					return assert( siteSelectorShown, 'The site selector was not shown' );
				} );

				it( 'can select the first site sites', async () => {
					await testContext.siteSelector.selectFirstSite();
					return await testContext.siteSelector.ok();
				} );

				describe( 'Successful activation dialog', () => {
					it( 'should show the successful activation dialog', async () => {
						const themeDialogComponent = await ThemeDialogComponent.Expect( driver );
						return await themeDialogComponent.goToThemeDetail();
					} );

					it(
						'should show the correct theme in the current theme bar',
						async () => {
							testContext.themeDetailPage = await ThemeDetailPage.Expect( driver );
							await testContext.themeDetailPage.goBackToAllThemes();
							testContext.currentThemeComponent = await CurrentThemeComponent.Expect( driver );
							let name = await testContext.currentThemeComponent.getThemeName();
							return assert.strictEqual( name, testContext.currentThemeName );
						}
					);

					it( 'should highlight the current theme as active', async () => {
						await testContext.themesPage.showOnlyFreeThemes();
						await testContext.themesPage.searchFor( testContext.themeSearchName );
						let name = await testContext.themesPage.getActiveThemeName();
						return assert.strictEqual( name, testContext.currentThemeName );
					} );
				} );
			} );
		} );
	} );
} );

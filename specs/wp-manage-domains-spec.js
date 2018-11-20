/** @format */

import config from 'config';
import * as driverManager from '../lib/driver-manager.js';
import * as dataHelper from '../lib/data-helper.js';

import DomainsPage from '../lib/pages/domains-page.js';
import CheckOutPage from '../lib/pages/signup/checkout-page.js';
import ReaderPage from '../lib/pages/reader-page.js';
import StatsPage from '../lib/pages/stats-page.js';

import FindADomainComponent from '../lib/components/find-a-domain-component.js';
import RegistrationUnavailableComponent from '../lib/components/domain-registration-unavailable-component';
import SecurePaymentComponent from '../lib/components/secure-payment-component.js';
import ShoppingCartWidgetComponent from '../lib/components/shopping-cart-widget-component.js';
import SidebarComponent from '../lib/components/sidebar-component.js';
import NavBarComponent from '../lib/components/nav-bar-component.js';
import MyOwnDomainPage from '../lib/pages/domain-my-own-page';
import MapADomainPage from '../lib/pages/domain-map-page';
import TransferDomainPage from '../lib/pages/transfer-domain-page';
import TransferDomainPrecheckPage from '../lib/pages/transfer-domain-precheck-page';
import EnterADomainComponent from '../lib/components/enter-a-domain-component';
import MapADomainCheckoutPage from '../lib/pages/domain-map-checkout-page';

import LoginFlow from '../lib/flows/login-flow.js';

import * as SlackNotifier from '../lib/slack-notifier';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const domainsInboxId = config.get( 'domainsInboxId' );
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Managing Domains: (${ screenSize }) @parallel`, () => {
	jest.setTimeout( mochaTimeOut );

	describe( 'Adding a domain to an existing site ', () => {
		const blogName = dataHelper.getNewBlogName();
		const domainEmailAddress = dataHelper.getEmailAddress( blogName, domainsInboxId );
		const expectedDomainName = blogName + '.com';
		const testDomainRegistarDetails = dataHelper.getTestDomainRegistarDetails( domainEmailAddress );

		beforeAll( async function () {
			if ( process.env.SKIP_DOMAIN_TESTS === 'true' ) {
				await SlackNotifier.warn(
					'Domains tests are currently disabled as SKIP_DOMAIN_TESTS is set to true',
					{ suppressDuplicateMessages: true }
				);
				return this.skip();
			}
		} );

		it( 'Log In and Select Domains', async () => {
			return await new LoginFlow( driver ).loginAndSelectDomains();
		} );

		it( 'Can see the Domains page and choose add a domain', async () => {
			const domainsPage = await DomainsPage.Expect( driver );
			await domainsPage.setABTestControlGroupsInLocalStorage();
			return await domainsPage.clickAddDomain();
		} );

		it( 'Can see the domain search component', async () => {
			let findADomainComponent;
			try {
				findADomainComponent = await FindADomainComponent.Expect( driver );
			} catch ( err ) {
				if ( await RegistrationUnavailableComponent.Expect( driver ) ) {
					await SlackNotifier.warn( 'SKIPPING: Domain registration is currently unavailable. ', {
						suppressDuplicateMessages: true,
					} );
					return this.skip();
				}
			}
			return await findADomainComponent.waitForResults();
		} );

		it( 'Can search for a blog name', async () => {
			const findADomainComponent = await FindADomainComponent.Expect( driver );
			return await findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
		} );

		it(
			'Can select the .com search result and decline Google Apps for email',
			async () => {
				const findADomainComponent = await FindADomainComponent.Expect( driver );
				await findADomainComponent.selectDomainAddress( expectedDomainName );
				return await findADomainComponent.declineGoogleApps();
			}
		);

		it(
			'Can see checkout page, choose privacy and enter registrar details',
			async () => {
				const checkOutPage = await CheckOutPage.Expect( driver );
				await checkOutPage.selectAddPrivacyProtectionCheckbox();
				await checkOutPage.enterRegistarDetails( testDomainRegistarDetails );
				return await checkOutPage.submitForm();
			}
		);

		it( 'Can then see secure payment component', async () => {
			return await SecurePaymentComponent.Expect( driver );
		} );

		it( 'Empty the cart', async () => {
			await ReaderPage.Visit( driver );
			const navBarComponent = await NavBarComponent.Expect( driver );
			await navBarComponent.clickMySites();
			await StatsPage.Expect( driver );
			const sidebarComponent = await SidebarComponent.Expect( driver );
			await sidebarComponent.selectDomains();
			await DomainsPage.Expect( driver );
			const shoppingCartWidgetComponent = await ShoppingCartWidgetComponent.Expect( driver );
			return await shoppingCartWidgetComponent.empty();
		} );
	} );

	describe( 'Map a domain to an existing site @parallel', () => {
		const blogName = 'go.com';

		beforeAll( async function () {
			if ( process.env.SKIP_DOMAIN_TESTS === 'true' ) {
				await SlackNotifier.warn(
					'Domains tests are currently disabled as SKIP_DOMAIN_TESTS is set to true',
					{ suppressDuplicateMessages: true }
				);
				return this.skip();
			}
		} );

		it( 'Log In and Select Domains', async () => {
			return await new LoginFlow( driver ).loginAndSelectDomains();
		} );

		it( 'Can see the Domains page and choose add a domain', async () => {
			const domainsPage = await DomainsPage.Expect( driver );
			await domainsPage.setABTestControlGroupsInLocalStorage();
			return await domainsPage.clickAddDomain();
		} );

		it( 'Can see the domain search component', async () => {
			let findADomainComponent;
			try {
				findADomainComponent = await FindADomainComponent.Expect( driver );
			} catch ( err ) {
				if ( await RegistrationUnavailableComponent.Expect( driver ) ) {
					await SlackNotifier.warn( 'SKIPPING: Domain registration is currently unavailable. ', {
						suppressDuplicateMessages: true,
					} );
					return this.skip();
				}
			}
			return await findADomainComponent.waitForResults();
		} );

		it( 'Can select to use an existing domain', async () => {
			const findADomainComponent = await FindADomainComponent.Expect( driver );
			return await findADomainComponent.selectUseOwnDomain();
		} );

		it( 'Can see use my own domain page', async () => {
			return await MyOwnDomainPage.Expect( driver );
		} );

		it( 'Can select to buy domain mapping', async () => {
			const myOwnDomainPage = await MyOwnDomainPage.Expect( driver );
			return await myOwnDomainPage.selectBuyDomainMapping();
		} );

		it( 'Can see enter a domain component', async () => {
			return await MapADomainPage.Expect( driver );
		} );

		it( 'Can enter the domain name', async () => {
			const enterADomainComponent = await EnterADomainComponent.Expect( driver );
			return await enterADomainComponent.enterADomain( blogName );
		} );

		it( 'Can add domain to the cart', async () => {
			const enterADomainComponent = await EnterADomainComponent.Expect( driver );
			return await enterADomainComponent.clickonAddButtonToAddDomainToTheCart();
		} );

		it( 'Can see checkout page', async () => {
			return await MapADomainCheckoutPage.Expect( driver );
		} );

		it( 'Empty the cart', async () => {
			await ReaderPage.Visit( driver );
			const navBarComponent = await NavBarComponent.Expect( driver );
			await navBarComponent.clickMySites();
			await StatsPage.Expect( driver );
			const sideBarComponent = await SidebarComponent.Expect( driver );
			await sideBarComponent.selectDomains();
			await DomainsPage.Expect( driver );
			const shoppingCartWidgetComponent = await ShoppingCartWidgetComponent.Expect( driver );
			return await shoppingCartWidgetComponent.empty();
		} );
	} );

	describe( 'Transfer a domain to an existing site (partial) @parallel', () => {
		const domain = 'automattic.com';

		beforeAll( async function () {
			if ( process.env.SKIP_DOMAIN_TESTS === 'true' ) {
				await SlackNotifier.warn(
					'Domains tests are currently disabled as SKIP_DOMAIN_TESTS is set to true',
					{ suppressDuplicateMessages: true }
				);
				return this.skip();
			}
		} );

		it( 'Log In and Select Domains', async () => {
			return await new LoginFlow( driver ).loginAndSelectDomains();
		} );

		it( 'Can see the Domains page and choose add a domain', async () => {
			const domainsPage = await DomainsPage.Expect( driver );
			await domainsPage.setABTestControlGroupsInLocalStorage();
			return await domainsPage.clickAddDomain();
		} );

		it( 'Can see the domain search component', async () => {
			let findADomainComponent;
			try {
				findADomainComponent = await FindADomainComponent.Expect( driver );
			} catch ( err ) {
				if ( await RegistrationUnavailableComponent.Expect( driver ) ) {
					await SlackNotifier.warn( 'SKIPPING: Domain registration is currently unavailable. ', {
						suppressDuplicateMessages: true,
					} );
					return this.skip();
				}
			}
			return await findADomainComponent.waitForResults();
		} );

		it( 'Can select to use an existing domain', async () => {
			const findADomainComponent = await FindADomainComponent.Expect( driver );
			return await findADomainComponent.selectUseOwnDomain();
		} );

		it( 'Can see use my own domain page', async () => {
			return await MyOwnDomainPage.Expect( driver );
		} );

		it( 'Can select to transfer a domain', async () => {
			const myOwnDomainPage = await MyOwnDomainPage.Expect( driver );
			return await myOwnDomainPage.selectTransferDomain();
		} );

		it( 'Can see the transfer my domain page', async () => {
			return await TransferDomainPage.Expect( driver );
		} );

		it( 'Can enter the domain name', async () => {
			const transferDomainPage = await TransferDomainPage.Expect( driver );
			return await transferDomainPage.enterADomain( domain );
		} );

		it( 'Click transfer domain button', async () => {
			const transferDomainPage = await TransferDomainPage.Expect( driver );
			return await transferDomainPage.clickTransferDomain();
		} );

		it( 'Can see the transfer precheck page', async () => {
			return await TransferDomainPrecheckPage.Expect( driver );
		} );
	} );
} );

/** @format */

import config from 'config';
import assert from 'assert';

import * as driverManager from '../lib/driver-manager.js';
import * as dataHelper from '../lib/data-helper';

import LoginFlow from '../lib/flows/login-flow.js';

import PlansPage from '../lib/pages/plans-page.js';
import StatsPage from '../lib/pages/stats-page.js';
import PlanCheckoutPage from '../lib/pages/plan-checkout-page';

import SidebarComponent from '../lib/components/sidebar-component.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Plans: (${ screenSize }) @parallel @jetpack`, () => {
	jest.setTimeout( mochaTimeOut );

	describe( 'Comparing Plans:', () => {
		it( 'Login and Select My Site', async () => {
			const loginFlow = new LoginFlow( driver );
			return await loginFlow.loginAndSelectMySite();
		} );

		it( 'Can Select Plans', async () => {
			const statsPage = await StatsPage.Expect( driver );
			await statsPage.waitForPage();
			const sideBarComponent = await SidebarComponent.Expect( driver );
			return await sideBarComponent.selectPlan();
		} );

		it( 'Can See Plans', async () => {
			return await PlansPage.Expect( driver );
		} );

		it( 'Can Compare Plans', async () => {
			const plansPage = await PlansPage.Expect( driver );
			if ( host === 'WPCOM' ) {
				await plansPage.openPlansTab();
				return await plansPage.waitForComparison();
			}

			// Jetpack
			const displayed = await plansPage.planTypesShown( 'jetpack' );
			return assert( displayed, 'The Jetpack plans are NOT displayed' );
		} );

		if ( host === 'WPCOM' ) {
			it( 'Can Verify Current Plan', async () => {
				const planName = 'premium';
				const plansPage = await PlansPage.Expect( driver );
				const present = await plansPage.confirmCurrentPlan( planName );
				return assert( present, `Failed to detect correct plan (${ planName })` );
			} );
		}
	} );

	describe( 'Viewing a specific plan with coupon:', () => {
		let originalCartAmount, loginFlow;

		beforeAll( async function () {
			return await driverManager.ensureNotLoggedIn( driver );
		} );

		it( 'Login and Select My Site', async () => {
			loginFlow = new LoginFlow( driver );
			return await loginFlow.loginAndSelectMySite();
		} );

		it( 'Can Select Plans', async () => {
			const statsPage = await StatsPage.Expect( driver );
			await statsPage.waitForPage();
			const sideBarComponent = await SidebarComponent.Expect( driver );
			return await sideBarComponent.selectPlan();
		} );

		it( 'Can Select Plans tab', async () => {
			const plansPage = await PlansPage.Expect( driver );
			if ( host === 'WPCOM' ) {
				await plansPage.openPlansTab();
				return await plansPage.waitForComparison();
			}

			// Jetpack
			const displayed = await plansPage.planTypesShown( 'jetpack' );
			return assert( displayed, 'The Jetpack plans are NOT displayed' );
		} );

		it( 'Select Business Plan', async () => {
			const plansPage = await PlansPage.Expect( driver );
			return await plansPage.selectBusinessPlan();
		} );

		it( 'Remove any existing coupon', async () => {
			const planCheckoutPage = await PlanCheckoutPage.Expect( driver );

			if ( await planCheckoutPage.hasCouponApplied() ) {
				await planCheckoutPage.removeCoupon();
			}
		} );

		it( 'Can Correctly Apply Coupon', async () => {
			const planCheckoutPage = await PlanCheckoutPage.Expect( driver );

			await planCheckoutPage.toggleCartSummary();
			originalCartAmount = await planCheckoutPage.cartTotalAmount();

			await planCheckoutPage.enterCouponCode( dataHelper.getTestCouponCode() );

			let newCartAmount = await planCheckoutPage.cartTotalAmount();
			let expectedCartAmount = parseFloat( ( originalCartAmount * 0.99 ).toFixed( 2 ) );

			assert.strictEqual( newCartAmount, expectedCartAmount, 'Coupon not applied properly' );
		} );

		it( 'Can Remove Coupon', async () => {
			const planCheckoutPage = await PlanCheckoutPage.Expect( driver );

			await planCheckoutPage.removeCoupon();

			let removedCouponAmount = await planCheckoutPage.cartTotalAmount();
			assert.strictEqual( removedCouponAmount, originalCartAmount, 'Coupon not removed properly' );
		} );

		it( 'Remove from cart', async () => {
			const planCheckoutPage = await PlanCheckoutPage.Expect( driver );

			return await planCheckoutPage.removeFromCart();
		} );
	} );
} );

/** @format */

import config from 'config';

import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';
import * as mediaHelper from '../lib/media-helper';
import LoginFlow from '../lib/flows/login-flow';
import EditorPage from '../lib/pages/editor-page';
import PostEditorToolbarComponent from '../lib/components/post-editor-toolbar-component';
import CommentsAreaComponent from '../lib/pages/frontend/comments-area-component';

const host = dataHelper.getJetpackHost();
const screenSize = driverManager.currentScreenSize();
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const mochaTimeoutMS = config.get( 'mochaTimeoutMS' );
const blogPostTitle = dataHelper.randomPhrase();
const blogPostQuote =
	'The foolish man seeks happiness in the distance. The wise grows it under his feet.\n— James Oppenheim';

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Comments: (${ screenSize })`, () => {
	let fileDetails;
	jest.setTimeout( mochaTimeoutMS );

	// Create image file for upload
	beforeAll( async function () {
		fileDetails = await mediaHelper.createFile();
		return fileDetails;
	} );

	describe( 'Commenting and replying to newly created post: @parallel @jetpack', () => {
		it( 'Can login and create a new post', async () => {
			await new LoginFlow( driver ).loginAndStartNewPost();
			const editorPage = await EditorPage.Expect( driver );
			await editorPage.enterTitle( blogPostTitle );
			await editorPage.enterContent( blogPostQuote + '\n' );
		} );

		it( 'Can publish and visit site', async () => {
			const postEditorToolbar = await PostEditorToolbarComponent.Expect( driver );
			await postEditorToolbar.ensureSaved();
			await postEditorToolbar.publishAndViewContent( { useConfirmStep: true } );
		} );

		it( 'Can post a comment', async () => {
			const commentArea = await CommentsAreaComponent.Expect( driver );
			return await commentArea._postComment( {
				comment: dataHelper.randomPhrase(),
				name: 'e2eTestName',
				email: 'e2eTestName@test.com',
			} );
		} );

		it( 'Can post a reply', async () => {
			await driver.sleep( 10000 ); // Wait to not to post too quickly
			const commentArea = await CommentsAreaComponent.Expect( driver );
			await commentArea.reply(
				{
					comment: dataHelper.randomPhrase(),
					name: 'e2eTestName',
					email: 'e2eTestName@test.com',
				},
				2
			);
		} );
	} );
} );

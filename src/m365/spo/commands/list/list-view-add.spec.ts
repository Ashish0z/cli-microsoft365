import * as assert from 'assert';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import { pid } from '../../../../utils/pid';
import { sinonUtil } from '../../../../utils/sinonUtil';
import { urlUtil } from '../../../../utils/urlUtil';
import request from '../../../../request';
import commands from '../../commands';
import { formatting } from '../../../../utils/formatting';
const command: Command = require('./list-view-add');

describe(commands.LIST_VIEW_ADD, () => {

  const validListTitle = 'List title';
  const validListId = '00000000-0000-0000-0000-000000000000';
  const validListUrl = '/Lists/SampleList';
  const validTitle = 'View title';
  const validWebUrl = 'https://contoso.sharepoint.com/sites/project-x';
  const validFieldsInput = 'Field1,Field2,Field3';

  const viewCreationResponse = {
    DefaultView: false,
    Hidden: false,
    Id: "00000000-0000-0000-0000-000000000000",
    MobileDefaultView: false,
    MobileView: false,
    Paged: true,
    PersonalView: false,
    ViewProjectedFields: null,
    ViewQuery: "",
    RowLimit: 30,
    Scope: 0,
    ServerRelativePath: {
      DecodedUrl: `/sites/project-x/Lists/${validListTitle}/${validTitle}.aspx`
    },
    ServerRelativeUrl: `/sites/project-x/Lists/${validListTitle}/${validTitle}.aspx`,
    Title: validTitle
  };

  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    auth.service.connected = true;
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent,
      pid.getProcessName
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.LIST_VIEW_ADD), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('has correct option sets', () => {
    assert.deepStrictEqual(command.optionSets, [{ options: ['listId', 'listTitle', 'listUrl'] }]);
  });

  it('fails validation if webUrl is not a valid SharePoint URL', async () => {
    const actual = await command.validate({
      options: {
        webUrl: 'invalid',
        listTitle: validListTitle,
        title: validTitle,
        fields: validFieldsInput
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if listId is not a valid GUID', async () => {
    const actual = await command.validate({
      options: {
        webUrl: validWebUrl,
        listId: 'invalid',
        title: validTitle,
        fields: validFieldsInput
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if rowLimit is not a number', async () => {
    const actual = await command.validate({
      options: {
        webUrl: validWebUrl,
        listId: validListId,
        title: validTitle,
        fields: validFieldsInput,
        rowLimit: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if rowLimit is lower than 1', async () => {
    const actual = await command.validate({
      options: {
        webUrl: validWebUrl,
        listId: validListId,
        title: validTitle,
        fields: validFieldsInput,
        rowLimit: 0
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when setting default and personal option', async () => {
    const actual = await command.validate({
      options: {
        webUrl: validWebUrl,
        listId: validListId,
        title: validTitle,
        fields: validFieldsInput,
        personal: true,
        default: true
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('correctly validates options', async () => {
    const actual = await command.validate({
      options: {
        webUrl: validWebUrl,
        listId: validListId,
        title: validTitle,
        fields: validFieldsInput
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('Correctly add view by list title', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url === `${validWebUrl}/_api/web/lists/getByTitle(\'${formatting.encodeQueryParameter(validListTitle)}\')/views/add`) {
        return Promise.resolve(viewCreationResponse);
      }

      return Promise.reject('Invalid Request');
    });

    await command.action(logger, {
      options: {
        webUrl: validWebUrl,
        listTitle: validListTitle,
        title: validTitle,
        fields: validFieldsInput
      }
    });
    assert(loggerLogSpy.calledWith(viewCreationResponse));
  });

  it('Correctly add view by list id', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url === `${validWebUrl}/_api/web/lists(guid\'${formatting.encodeQueryParameter(validListId)}\')/views/add`) {
        return Promise.resolve(viewCreationResponse);
      }

      return Promise.reject('Invalid Request');
    });

    await command.action(logger, {
      options: {
        webUrl: validWebUrl,
        listId: validListId,
        title: validTitle,
        fields: validFieldsInput
      }
    });
    assert(loggerLogSpy.calledWith(viewCreationResponse));
  });

  it('Correctly add view by list URL', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url === `${validWebUrl}/_api/web/GetList(\'${formatting.encodeQueryParameter(urlUtil.getServerRelativePath(validWebUrl, validListUrl))}\')/views/add`) {
        return Promise.resolve(viewCreationResponse);
      }

      return Promise.reject('Invalid Request');
    });

    await command.action(logger, {
      options: {
        webUrl: validWebUrl,
        listUrl: validListUrl,
        title: validTitle,
        fields: validFieldsInput,
        rowLimit: 100
      }
    });
    assert(loggerLogSpy.calledWith(viewCreationResponse));
  });

  it('handles error correctly', async () => {
    sinon.stub(request, 'post').callsFake(() => {
      return Promise.reject('An error has occurred');
    });

    await assert.rejects(command.action(logger, {
      options: {
        webUrl: validWebUrl,
        listUrl: validListUrl,
        title: validTitle,
        fields: validFieldsInput,
        rowLimit: 100
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('supports debug mode', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});
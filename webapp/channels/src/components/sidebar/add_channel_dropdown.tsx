// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import {trackEvent} from 'actions/telemetry_actions';

import {CreateAndJoinChannelsTour, InvitePeopleTour} from 'components/tours/onboarding_tour';
import Menu from 'components/widgets/menu/menu';
import MenuWrapper from 'components/widgets/menu/menu_wrapper';
import WithTooltip from 'components/with_tooltip';
import MenuItemAction from 'components/widgets/menu/menu_items/menu_item_action';
import * as NewMenu from 'components/menu';
import {
    PlusIcon,
} from '@mattermost/compass-icons/components';

type Props = {
    canCreateChannel: boolean;
    canJoinPublicChannel: boolean;
    userGroupsEnabled: boolean;
    showMoreChannelsModal: () => void;
    showCreateUserGroupModal: () => void;
    invitePeopleModal: () => void;
    showNewChannelModal: () => void;
    showCreateCategoryModal: () => void;
    handleOpenDirectMessagesModal: (e: Event) => void;
    unreadFilterEnabled: boolean;
    showCreateTutorialTip: boolean;
    showInviteTutorialTip: boolean;
    isAddChannelOpen: boolean;
    openAddChannelOpen: (open: boolean) => void;
    canCreateCustomGroups: boolean;
};

const AddChannelDropdown = ({
    canCreateChannel,
    canJoinPublicChannel,
    showMoreChannelsModal,
    showCreateUserGroupModal,
    invitePeopleModal,
    showNewChannelModal,
    showCreateCategoryModal,
    handleOpenDirectMessagesModal,
    unreadFilterEnabled,
    showCreateTutorialTip,
    showInviteTutorialTip,
    isAddChannelOpen,
    openAddChannelOpen,
    canCreateCustomGroups,
}: Props) => {
    const intl = useIntl();

     const invitePeople = (
            <MenuItemAction
                id='invitePeople'
                onClick={invitePeopleModal}
                icon={<i className='icon-account-plus-outline'/>}
                text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.invitePeople', defaultMessage: 'Invite people'})}
                extraText={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.invitePeopleExtraText', defaultMessage: 'Add people to the team'})}
            />
        );

        let joinPublicChannel;
        if (canJoinPublicChannel) {
            joinPublicChannel = (
                <MenuItemAction
                    id='showMoreChannels'
                    onClick={showMoreChannelsModal}
                    icon={<i className='icon-globe'/>}
                    text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.browseChannels', defaultMessage: 'Browse channels'})}
                />
            );
        }

        let createChannel;
        if (canCreateChannel) {
            createChannel = (
                <MenuItemAction
                    id='showNewChannel'
                    onClick={showNewChannelModal}
                    icon={<i className='icon-plus'/>}
                    text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.createNewChannel', defaultMessage: 'Create new channel'})}
                />
            );
        }

        let createCategory;
        if (!unreadFilterEnabled) {
            createCategory = (
                    <MenuItemAction
                        id='createCategory'
                        onClick={showCreateCategoryModal}
                        icon={<i className='icon-folder-plus-outline'/>}
                        text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.createCategory', defaultMessage: 'Create new category'})}
                    />
                );
        }

        const createDirectMessage = (
            <MenuItemAction
                id={'openDirectMessageMenuItem'}
                onClick={handleOpenDirectMessagesModal}
                icon={<i className='icon-account-outline'/>}
                text={intl.formatMessage({id: 'sidebar.openDirectMessage', defaultMessage: 'Open a direct message'})}
            />
        );

        let createUserGroup;
        if (canCreateCustomGroups) {
            createUserGroup = (
                <MenuItemAction
                    id={'createUserGroup'}
                    onClick={showCreateUserGroupModal}
                    icon={<i className='icon-account-multiple-plus-outline'/>}
                    text={intl.formatMessage({id: 'sidebar.createUserGroup', defaultMessage: 'Create New User Group'})}
                />
            );
        }

        // return (
        //     <>
        //         <>
        //             {createChannel}
        //             {joinPublicChannel}
        //             {createDirectMessage}
        //             {showCreateTutorialTip && <CreateAndJoinChannelsTour/>}
        //             {createUserGroup}
        //         </>
        //         {createCategory}
        //         {invitePeople}
        //     </>
        // );

    const renderDropdownItems = () => {
        const invitePeople = (
            <>
                <MenuItemAction
                    id='invitePeople'
                    onClick={invitePeopleModal}
                    icon={<i className='icon-account-plus-outline'/>}
                    text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.invitePeople', defaultMessage: 'Invite people'})}
                    extraText={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.invitePeopleExtraText', defaultMessage: 'Add people to the team'})}
                />
                {showInviteTutorialTip && <InvitePeopleTour/>}
            </>
        );

        let joinPublicChannel;
        if (canJoinPublicChannel) {
            joinPublicChannel = (
                <MenuItemAction
                    id='showMoreChannels'
                    onClick={showMoreChannelsModal}
                    icon={<i className='icon-globe'/>}
                    text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.browseChannels', defaultMessage: 'Browse channels'})}
                />
            );
        }

        let createChannel;
        if (canCreateChannel) {
            createChannel = (
                <MenuItemAction
                    id='showNewChannel'
                    onClick={showNewChannelModal}
                    icon={<i className='icon-plus'/>}
                    text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.createNewChannel', defaultMessage: 'Create new channel'})}
                />
            );
        }

        let createCategory;
        if (!unreadFilterEnabled) {
            createCategory = (
                <>
                    <MenuItemAction
                        id='createCategory'
                        onClick={showCreateCategoryModal}
                        icon={<i className='icon-folder-plus-outline'/>}
                        text={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.createCategory', defaultMessage: 'Create new category'})}
                    />
                </>);
        }

        const createDirectMessage = (
            <MenuItemAction
                id={'openDirectMessageMenuItem'}
                onClick={handleOpenDirectMessagesModal}
                icon={<i className='icon-account-outline'/>}
                text={intl.formatMessage({id: 'sidebar.openDirectMessage', defaultMessage: 'Open a direct message'})}
            />
        );

        let createUserGroup;
        if (canCreateCustomGroups) {
            createUserGroup = (
                <MenuItemAction
                    id={'createUserGroup'}
                    onClick={showCreateUserGroupModal}
                    icon={<i className='icon-account-multiple-plus-outline'/>}
                    text={intl.formatMessage({id: 'sidebar.createUserGroup', defaultMessage: 'Create New User Group'})}
                />
            );
        }

        return (
            <>
                <>
                    {createChannel}
                    {joinPublicChannel}
                    {createDirectMessage}
                    {showCreateTutorialTip && <CreateAndJoinChannelsTour/>}
                    {createUserGroup}
                </>
                {createCategory}
                {invitePeople}
            </>
        );
    };

    const trackOpen = (opened: boolean) => {
        openAddChannelOpen(opened);
        if (opened) {
            trackEvent('ui', 'ui_add_channel_dropdown_opened');
        }
    };

    if (!(canCreateChannel || canJoinPublicChannel)) {
        return null;
    }

    return (
        <NewMenu.Container
            // This button's styling needs to be improved. It's width
            // and height should be fixed
            menuButton={{
                id: 'sample id for testing',
                'aria-label': intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.dropdownAriaLabel', defaultMessage: 'Add Channel Dropdown'}),
                class: 'AddChannelDropdown_dropdownButton',
                children: <i className='icon-plus'/>,
            }}
            menuButtonTooltip={{
                id: 'new-group-tooltip',
                placement: 'top',
                text: intl.formatMessage({
                    id: 'sidebar_left.add_channel_dropdown.browseOrCreateChannels',
                    defaultMessage: 'Browse or create channels',
                })
            }}
            menu={{
                id: 'AddChannelDropdown',
                'aria-label': intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.dropdownAriaLabel', defaultMessage: 'Add Channel Dropdown'}),
                className: 'Mui-modified-menu',
            }}
        >
            {/* First item needs to be <Menu.Item> otherwise
            UP/DOWN accessibility won't work */}
            {createChannel}
            {joinPublicChannel}
            {createDirectMessage}
            {showCreateTutorialTip && <CreateAndJoinChannelsTour/>}
            {createUserGroup}
            <NewMenu.Separator />
            {createCategory}
            <NewMenu.Separator />
            {invitePeople}
            {showInviteTutorialTip &&
            <NewMenu.Item
                labels={<InvitePeopleTour/>}
            />}
        </NewMenu.Container>

        // <MenuWrapper
        //     className='AddChannelDropdown'
        //     onToggle={trackOpen}
        //     open={isAddChannelOpen}
        // >
        //     <WithTooltip
        //         id='new-group-tooltip'
        //         placement='top'
        //         title={intl.formatMessage({
        //             id: 'sidebar_left.add_channel_dropdown.browseOrCreateChannels',
        //             defaultMessage: 'Browse or create channels',
        //         })}
        //     >
        //         <button
        //             className={'AddChannelDropdown_dropdownButton'}
        //             aria-label={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.dropdownAriaLabel', defaultMessage: 'Add Channel Dropdown'})}
        //         >
        //             <i className='icon-plus'/>
        //         </button>
        //     </WithTooltip>
        //     <Menu
        //         id='AddChannelDropdown'
        //         ariaLabel={intl.formatMessage({id: 'sidebar_left.add_channel_dropdown.dropdownAriaLabel', defaultMessage: 'Add Channel Dropdown'})}
        //     >
        //         {renderDropdownItems()}
        //     </Menu>
        // </MenuWrapper>
    );
};

export default AddChannelDropdown;

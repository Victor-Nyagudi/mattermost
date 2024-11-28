// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

// Compass components, where this comes from,  is a deprecated library.
import IconButton from '@mattermost/compass-components/components/icon-button'; // eslint-disable-line no-restricted-imports
import {
    ProductsIcon,
} from '@mattermost/compass-icons/components';
import classNames from 'classnames';

import {getLicense} from 'mattermost-redux/selectors/entities/general';

import {setProductMenuSwitcherOpen} from 'actions/views/product_menu';
import {isSwitcherOpen} from 'selectors/views/product_menu';

import {
    OnboardingTaskCategory,
    OnboardingTasksName,
    TaskNameMapToSteps,
    useHandleOnBoardingTaskData,
} from 'components/onboarding_tasks';
import Menu from 'components/widgets/menu/menu';
import * as NewMenu from 'components/menu';
import MenuWrapper from 'components/widgets/menu/menu_wrapper';

import {useCurrentProductId, useProducts, isChannels} from 'utils/products';

import ProductBranding from './product_branding';
import ProductBrandingTeamEdition from './product_branding_team_edition';
import ProductMenuItem from './product_menu_item';
import ProductMenuList from './product_menu_list';

import {useClickOutsideRef} from '../../hooks';

// import './product_menu.scss';
import MenuCloudTrial from 'components/widgets/menu/menu_items/menu_cloud_trial';

export const ProductMenuContainer = styled.nav`
    display: flex;
    align-items: center;
    cursor: pointer;

    > * + * {
        margin-left: 12px;
    }
`;

const ProdMenuButton = styled.span`
    display: flex;
    align-items: center;

    > * + * {
        margin-left: 12px;
    }
`;

export const ProductMenuButton = styled(IconButton).attrs(() => ({
    id: 'product_switch_menu',
    icon: 'products',
    size: 'sm',

    // we currently need this, since not passing a onClick handler is disabling the IconButton
    // this is a known issue and is being tracked by UI platform team
    // TODO@UI: remove the onClick, when it is not a mandatory prop anymore
    // onClick: () => {},
    inverted: true,
    compact: true,
}))`
    > i::before {
        font-size: 20px;
        letter-spacing: 20px;
    }
`;

const ProductMenu = (): JSX.Element => {
    const {formatMessage} = useIntl();
    const products = useProducts();
    const dispatch = useDispatch();
    const switcherOpen = useSelector(isSwitcherOpen);
    const menuRef = useRef<HTMLDivElement>(null);
    const currentProductID = useCurrentProductId();
    const license = useSelector(getLicense);

    const handleClick = () => dispatch(setProductMenuSwitcherOpen(!switcherOpen));

    const handleOnBoardingTaskData = useHandleOnBoardingTaskData();

    const visitSystemConsoleTaskName = OnboardingTasksName.VISIT_SYSTEM_CONSOLE;
    const handleVisitConsoleClick = () => {
        const steps = TaskNameMapToSteps[visitSystemConsoleTaskName];
        handleOnBoardingTaskData(visitSystemConsoleTaskName, steps.FINISHED, true, 'finish');
        localStorage.setItem(OnboardingTaskCategory, 'true');
    };

    useClickOutsideRef(menuRef, () => {
        if (!switcherOpen) {
            return;
        }
        dispatch(setProductMenuSwitcherOpen(false));
    });

    const productItems = products?.map((product) => {
        let tourTip;

        return (
            <NewMenu.Item labels={<ProductMenuItem
                key={product.id}
                destination={product.switcherLinkURL}
                icon={product.switcherIcon}
                text={product.switcherText}
                active={product.id === currentProductID}
                onClick={handleClick}
                tourTip={tourTip}
                id={`product-menu-item-${product.pluginId || product.id}`}
            />} />

        );
    });

    return (
        <div ref={menuRef}>
            {/* <MenuWrapper
                open={switcherOpen}
            > */}
                {/* <ProductMenuContainer onClick={handleClick}>
                    <ProductMenuButton
                        active={switcherOpen}
                        aria-expanded={switcherOpen}
                        aria-label={formatMessage({id: 'global_header.productSwitchMenu', defaultMessage: 'Product switch menu'})}
                        aria-controls='product-switcher-menu'
                    />
                    {license.IsLicensed === 'false' && <ProductBrandingTeamEdition/>}
                    {license.IsLicensed === 'true' && <ProductBranding/>}
                </ProductMenuContainer> */}
                {/* The children (at least the first) HAVE to be a MenuItem, otherwise the accessibility with UP and DOWN arrows doesn't work. */}
                <NewMenu.Container
                    menuButton={{
                        id: 'product_switch_menu',
                        'aria-label': formatMessage({id: 'global_header.productSwitchMenu', defaultMessage: 'Product switch menu'}),
                        class: 'style--none',
                        children:
                            <ProdMenuButton>
                                <ProductsIcon size={20} />
                                {license.IsLicensed === 'false' && <ProductBrandingTeamEdition/>}
                    {license.IsLicensed === 'true' && <ProductBranding/>}
                            </ProdMenuButton>,
                    }}
                    menu={{
                        id: 'product-switcher-menu-dropdown',
                        "aria-label": 'switcherOpen',
                        className: 'Mui-modified-menu',
                        onKeyDown: handleClick,
                    }}
                >
                    {/* <ProductMenuItem
                        destination={'/'}
                        icon={'product-channels'}
                        text={'Channels'}
                        active={isChannels(currentProductID)}
                        onClick={handleClick}
                    /> */}
                    <NewMenu.Item labels={<ProductMenuItem
                        destination={'/'}
                        icon={'product-channels'}
                        text={'Channels'}
                        active={isChannels(currentProductID)}
                        onClick={handleClick}
                    />}/>
                    {productItems}
                    <ProductMenuList
                        isMessaging={isChannels(currentProductID)}
                        onClick={handleClick}
                        handleVisitConsoleClick={handleVisitConsoleClick}
                    />
                    {/* <NewMenu.Item labels={<FormattedMessage id="primary.label" defaultMessage="2nd Label"/>}/>
                    <NewMenu.Item labels={<FormattedMessage id="primary.label" defaultMessage="3rd Label"/>}/> */}
                </NewMenu.Container>
                {/* <Menu
                    listId={'product-switcher-menu-dropdown'}
                    className={'product-switcher-menu'}
                    id={'product-switcher-menu'}
                    ariaLabel={'switcherOpen'}
                >
                    <ProductMenuItem
                        destination={'/'}
                        icon={'product-channels'}
                        text={'Channels'}
                        active={isChannels(currentProductID)}
                        onClick={handleClick}
                    />
                    {productItems}

                    // * This should return a fragment whose children are <li></li>
                    <ProductMenuList
                        isMessaging={isChannels(currentProductID)}
                        onClick={handleClick}
                        handleVisitConsoleClick={handleVisitConsoleClick}
                    />
                    <Menu.Group>
                        <Menu.StartTrial
                            id='startTrial'
                        />
                    </Menu.Group>
                </Menu> */}
            {/* </MenuWrapper> */}
        </div>
    );
};

export default ProductMenu;
